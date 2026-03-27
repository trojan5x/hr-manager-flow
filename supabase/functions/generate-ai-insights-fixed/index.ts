import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const requestData = await req.json()

    if (!requestData.session_id || !requestData.score_breakdown) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: session_id, score_breakdown' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Generating AI insights for session: ${requestData.session_id}`)

    // Get GEMINI API key from environment (using your existing secret name)
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!apiKey) {
      console.log('No GEMINI_API_KEY found, using fallback insights')
      return new Response(
        JSON.stringify({
          success: true,
          data: generateFallbackInsights(requestData)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare assessment data for AI analysis
    const assessmentSummary = {
      role: requestData.role,
      overall_score: `${requestData.correct_answers}/${requestData.total_questions} (${requestData.overall_score}%)`,
      phase_performance: requestData.score_breakdown.map(phase => ({
        skill: phase.skill_name,
        score: `${phase.phase_correct_answers}/${phase.phase_total_questions} (${phase.phase_score}%)`,
        performance_level: phase.phase_score >= 80 ? 'Excellent' : phase.phase_score >= 60 ? 'Good' : 'Needs Improvement'
      }))
    }

    try {
      // Generate insights using Google Generative AI
      const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert HR assessment analyst. Based on this ${requestData.role} assessment data, generate personalized professional insights:

ASSESSMENT DATA:
${JSON.stringify(assessmentSummary, null, 2)}

TASK: Generate specific, actionable strengths and development areas.

RESPONSE FORMAT (return as valid JSON):
{
  "strengths": [
    {
      "category": "specific skill name",
      "description": "clear strength title", 
      "evidence": "specific evidence from performance data"
    }
  ],
  "weaknesses": [
    {
      "category": "specific skill name",
      "description": "development opportunity title",
      "recommendation": "specific, actionable improvement strategy"
    }
  ]
}

GUIDELINES:
- Use professional, encouraging language
- Base insights on actual performance data
- Provide specific, actionable recommendations
- Focus on 3-5 strengths and 1-3 development areas
- Reference specific skill areas from the assessment
- Avoid generic advice - be specific to ${requestData.role} role
- Frame weaknesses as growth opportunities

Generate the JSON response:`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
        })
      })

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text()
        console.error('Gemini API error:', aiResponse.status, aiResponse.statusText, errorText)
        throw new Error(`API Error: ${aiResponse.status}`)
      }

      const aiData = await aiResponse.json()
      
      if (!aiData.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('Invalid AI response structure:', aiData)
        throw new Error('Invalid AI response')
      }

      const aiText = aiData.candidates[0].content.parts[0].text
      console.log('Raw AI response:', aiText)

      let insightsData
      try {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          insightsData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in AI response')
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError)
        throw parseError
      }

      if (!insightsData.strengths || !insightsData.weaknesses) {
        throw new Error('Invalid insights structure')
      }

      // Store in database
      try {
        await supabaseClient
          .from('assessment_insights')
          .upsert({
            session_id: requestData.session_id,
            strengths: insightsData.strengths,
            weaknesses: insightsData.weaknesses,
            generated_at: new Date().toISOString(),
            ai_model: 'gemini-1.5-flash'
          }, { onConflict: 'session_id' })
      } catch (dbError) {
        console.warn('Failed to store insights:', dbError)
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            strengths: insightsData.strengths,
            weaknesses: insightsData.weaknesses
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (aiError) {
      console.error('AI processing failed, using fallback:', aiError)
      return new Response(
        JSON.stringify({
          success: true,
          data: generateFallbackInsights(requestData)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function generateFallbackInsights(data) {
  const strengths = []
  const weaknesses = []

  // Find strong performing areas (80%+)
  const strongAreas = data.score_breakdown.filter(phase => phase.phase_score >= 80)
  strongAreas.forEach(phase => {
    strengths.push({
      category: phase.skill_name,
      description: `Excellence in ${phase.skill_name}`,
      evidence: `Achieved ${phase.phase_score}% accuracy (${phase.phase_correct_answers}/${phase.phase_total_questions}) demonstrating strong competency`
    })
  })

  // Find improvement areas (<70%)
  const improvementAreas = data.score_breakdown.filter(phase => phase.phase_score < 70)
  improvementAreas.forEach(phase => {
    weaknesses.push({
      category: phase.skill_name,
      description: `Growth Opportunity in ${phase.skill_name}`,
      recommendation: `Focus on strengthening ${phase.skill_name} through targeted practice and professional development resources`
    })
  })

  // Ensure at least one of each
  if (strengths.length === 0) {
    strengths.push({
      category: 'Assessment Engagement',
      description: 'Strong Assessment Participation',
      evidence: 'Completed comprehensive assessment demonstrating commitment to professional development'
    })
  }

  if (weaknesses.length === 0) {
    const lowestArea = data.score_breakdown.reduce((min, phase) => 
      phase.phase_score < min.phase_score ? phase : min
    )
    weaknesses.push({
      category: lowestArea.skill_name,
      description: 'Enhancement Opportunity',
      recommendation: `Continue building expertise in ${lowestArea.skill_name} to achieve mastery level performance`
    })
  }

  return { strengths, weaknesses }
}