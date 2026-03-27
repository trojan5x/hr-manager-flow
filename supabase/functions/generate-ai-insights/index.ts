import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AssessmentInsightsRequest {
  session_id: string;
  score_breakdown: Array<{
    phase_name: string;
    phase_score: number;
    phase_correct_answers: number;
    phase_total_questions: number;
    skill_name: string;
  }>;
  answer_sheet: Array<{
    question: string;
    is_correct: boolean;
    users_answer: string;
    correct_answer: string;
  }>;
  overall_score: number;
  total_questions: number;
  correct_answers: number;
  role: string;
}

interface AIInsightsResponse {
  success: boolean;
  data?: {
    strengths: Array<{
      category: string;
      description: string;
      evidence: string;
    }>;
    weaknesses: Array<{
      category: string;
      description: string;
      recommendation: string;
    }>;
  };
  error?: string;
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

    const requestData: AssessmentInsightsRequest = await req.json()

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

    // Get Gemini API key from environment  
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      console.log('No GEMINI_API_KEY found, using fallback insights')
      // Use fallback instead of returning error
      const fallbackData = generateFallbackInsights(requestData)
      
      const response: AIInsightsResponse = {
        success: true,
        data: {
          strengths: fallbackData.strengths,
          weaknesses: fallbackData.weaknesses
        }
      }

      return new Response(
        JSON.stringify(response),
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
      })),
      // Include some example wrong answers for context (limit to protect privacy)
      sample_incorrect_responses: requestData.answer_sheet
        .filter(q => !q.is_correct)
        .slice(0, 3)
        .map(q => ({
          question_topic: q.question.substring(0, 100) + '...',
          selected: q.users_answer,
          correct: q.correct_answer
        }))
    }

    // Generate insights using Google Generative AI
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
          maxOutputTokens: 1024,
        }
      })
    })

    if (!aiResponse.ok) {
      console.error('Google AI API error:', aiResponse.status, aiResponse.statusText)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to generate AI insights' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const aiData = await aiResponse.json()
    
    if (!aiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid AI response structure:', aiData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid AI response format' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse the AI-generated insights
    const aiText = aiData.candidates[0].content.parts[0].text
    console.log('Raw AI response:', aiText)

    // Extract JSON from AI response (handle potential markdown formatting)
    let insightsData
    try {
      // Try to find JSON in the response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        insightsData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in AI response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      console.log('AI response text:', aiText)
      
      // Fallback to rule-based insights if AI parsing fails
      insightsData = generateFallbackInsights(requestData)
    }

    // Validate the structure
    if (!insightsData.strengths || !insightsData.weaknesses) {
      console.error('Invalid insights structure:', insightsData)
      insightsData = generateFallbackInsights(requestData)
    }

    // Optional: Store insights in database for caching
    try {
      await supabaseClient
        .from('assessment_insights')
        .upsert({
          session_id: requestData.session_id,
          strengths: insightsData.strengths,
          weaknesses: insightsData.weaknesses,
          generated_at: new Date().toISOString(),
          ai_model: 'gemini-1.5-flash'
        }, {
          onConflict: 'session_id'
        })
    } catch (dbError) {
      console.warn('Failed to store insights in database:', dbError)
      // Continue anyway - this is not critical
    }

    const response: AIInsightsResponse = {
      success: true,
      data: {
        strengths: insightsData.strengths,
        weaknesses: insightsData.weaknesses
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('AI insights generation error:', error)
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

// Fallback function for rule-based insights when AI fails
function generateFallbackInsights(data: AssessmentInsightsRequest) {
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

  // Ensure at least one strength and one weakness
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