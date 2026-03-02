/**
 * AI Prompt Template for Role Generation
 * 
 * This template provides comprehensive instructions for AI to generate
 * complete role data structures that match our database schema.
 */

export const generateRolePrompt = (roleName: string): string => {
  return `You are a professional role data generator. Generate a comprehensive role structure for "${roleName}" in JSON format only. No explanations, just valid JSON.

STUDY THIS EXAMPLE FROM OUR EXISTING HR MANAGER ROLE:
{
  "role": {
    "role_name": "HR Manager",
    "description": "Oversees the administrative and organizational functions of a company or business within the Human Resources department.",
    "frameworks": ["CHRPx", "SHRBPx", "PMHRx"]
  },
  "certificates": [
    {
      "name": "Certified Human Resources Professional",
      "short_name": "CHRPx1",
      "description": "Validates advanced expertise in human resources management, strategic talent acquisition, and employee relations."
    },
    {
      "name": "Strategic HR Business Partner", 
      "short_name": "SHRBPx",
      "description": "Demonstrates mastery in aligning HR strategies with business objectives and driving organizational performance."
    }
  ]
}

EXAMPLE HIGH-QUALITY SCENARIO (follow this structure exactly):
{
  "name": "Resource Allocation Crisis Management",
  "context": "A critical enterprise software project is 3 months behind schedule. The development team is stretched thin across multiple initiatives, and the CFO is questioning budget allocations.",
  "challenge": "Complex Resource Optimization Under Pressure",
  "task": "Perform a comprehensive resource analysis to optimize team allocation, identify bottlenecks, and develop a recovery plan that balances project priorities within budget constraints.",
  "key_concepts": ["Resource Optimization", "Capacity Planning", "Budget Management", "Team Allocation", "Critical Path Analysis", "Performance Metrics"],
  "project_mandate": {
    "initial_budget": "4 weeks recovery timeline. Current budget: $500K remaining. Access to team capacity data, project timelines, and cost tracking systems.",
    "high_level_goal": "Recover project timeline and optimize resource allocation to meet delivery commitments.",
    "business_problem": "Critical project delays threatening business objectives and stakeholder confidence."
  },
  "difficulty": "easy"
}

EXAMPLE HIGH-QUALITY QUESTIONS (follow this structure exactly):
{
  "scenario_index": 0,
  "question_text": "Your project is 3 months behind and the team is overallocated. What is your first priority as a Project Manager?",
  "options": [
    {"text": "Request more budget immediately.", "option_id": "A", "is_correct": false},
    {"text": "Conduct a comprehensive resource and capacity analysis to identify bottlenecks.", "option_id": "B", "is_correct": true},
    {"text": "Extend the project timeline automatically.", "option_id": "C", "is_correct": false},
    {"text": "Replace underperforming team members.", "option_id": "D", "is_correct": false}
  ]
}

CRITICAL REQUIREMENTS:
- Generate exactly 5 frameworks for this role (ending with 'x')
- Create exactly 5 certificates with specific pricing tiers
- Design exactly 5 assessment scenarios with increasing difficulty
- Create exactly 25 questions (5 per scenario) - THIS IS MANDATORY
- Each scenario must have exactly 5 questions with scenario_index 0,1,2,3,4
- Include professional SVG visual models for each scenario
- Follow the exact structure and naming conventions shown below

PRICING STRUCTURE (MUST FOLLOW):
- Certificate 1 (default): $99 / $299
- Certificate 2 (default): $149 / $349  
- Certificate 3 (secondary): $129 / $329
- Certificate 4 (secondary): $119 / $319
- Certificate 5 (ai): $159 / $359

DIFFICULTY PROGRESSION:
- Scenarios 1-2: "easy"
- Scenarios 3-5: "medium"

JSON STRUCTURE (Generate ALL fields exactly as shown):
{
  "role": {
    "role_name": "${roleName}",
    "slug": "kebab-case-version-of-role-name",
    "description": "Professional 2-sentence description of the role's responsibilities and impact",
    "core_skill": "Primary skill area for this role",
    "frameworks": ["Framework1x", "Framework2x", "Framework3x", "Framework4x", "Framework5x"],
    "status": "published"
  },
  "certificates": [
    {
      "name": "Full Certificate Name",
      "short_name": "ShortCode",
      "cert_id_prefix": "UPPERCASE_PREFIX",
      "type": "default",
      "order_index": 1,
      "preview_image": "https://placehold.co/600x400/000000/FFFFFF.png",
      "description": "Professional description of what this certification validates",
      "certificate_name": "Full Certificate Name Expert",
      "price": 99.00,
      "original_price": 299.00,
      "badge": "Core Certification",
      "skill_frameworks": ["Skill Area 1", "Skill Area 2", "Skill Area 3"]
    },
    // ... 4 more certificates with proper pricing and types
  ],
  "assessment": {
    "name": "${roleName} Assessment",
    "status": "published"
  },
  "phases": [
    {
      "order_index": 1,
      "name": "Phase 1 Name",
      "description": "Description of what this assessment phase evaluates"
    },
    // ... 4 more phases
  ],
  "scenarios": [
    {
      "name": "Professional Scenario Name 1",
      "principle": "${roleName} Best Practices",
      "context": "Realistic business context describing the situation - this is the scenario background",
      "challenge": "Specific challenge description - what makes this scenario difficult", 
      "task": "Clear task description of what needs to be accomplished",
      "key_concepts": ["Concept 1", "Concept 2", "Concept 3", "Concept 4", "Concept 5", "Concept 6"],
      "visual_model": {
        "svg": "<svg width=\\\"100%\\\" viewBox=\\\"0 0 400 220\\\"><rect x=\\\"50\\\" y=\\\"50\\\" width=\\\"100\\\" height=\\\"120\\\" fill=\\\"#00385C\\\" rx=\\\"4\\\"/><text x=\\\"60\\\" y=\\\"110\\\" fill=\\\"white\\\">Sample</text></svg>",
        "name": "Visual Model Name",
        "description": "Description of what the visual model represents"
      },
      "status": "draft",
      "difficulty": "easy",
      "skill_name": "Phase 1 Skill Name",
      "project_mandate": {
        "initial_budget": "Timeline and resource constraints for this scenario",
        "high_level_goal": "Clear statement of what needs to be achieved in this scenario",
        "business_problem": "The specific business problem this scenario addresses"
      }
    },
    // ... 4 more scenarios
  ],
  "questions": [
    // CRITICAL: Generate exactly 25 questions total
    // Scenarios 0: questions with "scenario_index": 0 (5 questions)
    // Scenarios 1: questions with "scenario_index": 1 (5 questions) 
    // Scenarios 2: questions with "scenario_index": 2 (5 questions)
    // Scenarios 3: questions with "scenario_index": 3 (5 questions)
    // Scenarios 4: questions with "scenario_index": 4 (5 questions)
    {
      "scenario_index": 0,
      "question_text": "Professional question related to scenario 1?",
      "options": [
        {"text": "Option A - incorrect but plausible", "option_id": "A", "is_correct": false},
        {"text": "Option B - correct answer with best practice", "option_id": "B", "is_correct": true},
        {"text": "Option C - incorrect but plausible", "option_id": "C", "is_correct": false},
        {"text": "Option D - incorrect but plausible", "option_id": "D", "is_correct": false}
      ]
    },
    // ... continue for all 25 questions, 5 per scenario
  ],
  "landingPage": {
    "slug": "same-as-role-slug",
    "hero_title": "Top 10% in ${roleName}",
    "hero_description": "Professional tagline about career advancement and skill validation for this role.",
    "content": {
      "scorecard_stats": [
        {"skill": "Core Skill Area 1", "percentage": 89},
        {"skill": "Core Skill Area 2", "percentage": 94},
        {"skill": "Core Skill Area 3", "percentage": 78},
        {"skill": "Core Skill Area 4", "percentage": 92},
        {"skill": "Core Skill Area 5", "percentage": 81}
      ]
    },
    "meta_title": "${roleName} Assessment & Certification",
    "meta_description": "Validate your seniority as a ${roleName} and unlock your true market value.",
    "keywords": "${roleName}, Professional Assessment, Certification, Career, Skills"
  }
}

CRITICAL REQUIREMENTS:
1. ⚠️ MANDATORY: Generate exactly 25 questions in the questions array ⚠️
2. Each scenario gets exactly 5 questions (scenario_index 0-4)
3. ⚠️ SVG ESCAPING: All double quotes in SVG must be escaped with \\\" ⚠️
4. All SVG visual models must be valid and professional with colors: #00385C, #38BDF8, #98D048, #0B1E32, #EF4444, #F59E0B
5. All pricing must match the specified tiers exactly
6. Framework names should end with 'x' (e.g., "PMMx", "AgilePMx")
7. Certificate prefixes should be ALL CAPS
8. All descriptions must be professional and industry-relevant
9. No placeholder text - generate real, meaningful content
10. Field meanings: 
   - context = business scenario background
   - challenge = what makes this scenario difficult  
   - task = what needs to be accomplished
   - project_mandate.business_problem = specific business problem
   - project_mandate.high_level_goal = what needs to be achieved
   - project_mandate.initial_budget = timeline/resource constraints
11. Return ONLY valid JSON, no additional text or explanations

SVG ESCAPING EXAMPLE:
❌ WRONG: "svg": "<svg width="100%" viewBox="0 0 400 200">...</svg>"
✅ CORRECT: "svg": "<svg width=\\\"100%\\\" viewBox=\\\"0 0 400 200\\\">...</svg>"

Generate the complete JSON now for the role: ${roleName}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const validateJSON = (jsonString: string): { isValid: boolean; error?: string; data?: any } => {
  try {
    const data = JSON.parse(jsonString);
    return { isValid: true, data };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON format' 
    };
  }
};