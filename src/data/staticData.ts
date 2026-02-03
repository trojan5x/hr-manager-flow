
import type { RoleContentResponse, ScenariosResponse, BundleProductResponse } from '../types';

// Certificate Images
import chrpImg from '../assets/certificateImages/CHRPx.png';
import shrbpImg from '../assets/certificateImages/SHRBPx.png';
import pasImg from '../assets/certificateImages/PASx.png';
import pmhrImg from '../assets/certificateImages/PMHRx.png';
import aiHrImg from '../assets/certificateImages/ai-in-hr.png';

export const HR_MANAGER_ROLE: RoleContentResponse = {
  success: true,
  status: 'ready',
  message: 'Content loaded successfully',
  data: {
    role: {
      id: 1,
      name: 'HR Manager',
      description: 'Drive organizational success through strategic talent management, employee engagement, and data-driven HR solutions.',
      role_core_skill: 'HR Management',
      frameworks: ['Strategic HR', 'Talent Management', 'Employee Relations', 'People Analytics'],
      skills: [
        {
          id: 101,
          skill_name: 'Certified HR Professional',
          description: 'Fundamental HR principles, employment law, and talent acquisition essentials.',
          certificate_preview_url: chrpImg,
          certificate_name: 'Certified HR Professional',
          certificate_name_short: 'CHRPx',
          skill_frameworks: ['Employment Law', 'Talent Acquisition'],
          domain: { id: 1, name: 'HR Operations', description: 'Core HR Skills' }
        },
        {
          id: 102,
          skill_name: 'Strategic HR Business Partner',
          description: 'Aligning HR strategies with business goals and organizational development.',
          certificate_preview_url: shrbpImg,
          certificate_name: 'Strategic HR Business Partner',
          certificate_name_short: 'SHRBPx',
          skill_frameworks: ['Strategic Planning', 'Org Development'],
          domain: { id: 1, name: 'Strategy', description: 'Advanced HR Skills' }
        },
        {
          id: 103,
          skill_name: 'Project Management for HR',
          description: 'Managing HR initiatives and transformation projects effectively.',
          certificate_preview_url: pmhrImg,
          certificate_name: 'Project Management for HR',
          certificate_name_short: 'PMHRx',
          skill_frameworks: ['Agile HR', 'Change Management'],
          domain: { id: 1, name: 'Management', description: 'HR Project Skills' }
        },
        {
          id: 104,
          skill_name: 'People Analytics Specialist',
          description: 'Using data to drive people decisions and optimize workforce performance.',
          certificate_preview_url: pasImg,
          certificate_name: 'People Analytics Specialist',
          certificate_name_short: 'PASx',
          skill_frameworks: ['Data Analysis', 'Workforce Planning'],
          domain: { id: 1, name: 'Analytics', description: 'HR Data Skills' }
        },
        {
          id: 105,
          skill_name: 'AI in HR Management',
          description: 'Leveraging Artificial Intelligence for recruitment, engagement, and operational efficiency.',
          certificate_preview_url: aiHrImg,
          certificate_name: 'AI in HR Professional',
          certificate_name_short: 'AI in HR',
          skill_frameworks: ['AI Recruitment', 'HR Tech'],
          domain: { id: 1, name: 'Technology', description: 'Future HR Skills' }
        }
      ]
    }
  }
};

const CERT_PRICES: Record<number, { price: number; original?: number; badge?: string }> = {
    101: { price: 1999 },
    102: { price: 1999 },
    103: { price: 999, original: 1999 },
    104: { price: 999, original: 1999 },
    105: { price: 499, original: 999, badge: 'POPULAR' }
};

export const MOCK_BUNDLE_PRODUCTS: BundleProductResponse = {
    result: 'success',
    message: 'Products loaded',
    data: {
        bundle_name: 'HR Management Professional Bundle',
        product_cost: 0, // Calculated dynamically
        certifications: HR_MANAGER_ROLE.data.role.skills.map(s => ({
            skill_id: s.id,
            certification_name: s.certificate_name || s.skill_name,
            certification_name_short: s.certificate_name_short || s.skill_name,
            skill_description: s.description,
            certificate_preview_url: s.certificate_preview_url,
            price: CERT_PRICES[s.id]?.price || 999,
            original_price: CERT_PRICES[s.id]?.original, // Optional original price
            badge: CERT_PRICES[s.id]?.badge
        }))
    }
}

export const MOCK_ASSESSMENT: ScenariosResponse = {
  success: true,
  message: 'Scenarios loaded',
  data: {
    bundle_id: 12345,
    role_name: 'HR Manager',
    progress: { ready: 5, total: 5, generating: 0, pending: 0 },
    scenarios: [
      {
  "scenario_id": 1,
  "skill_name": "Workforce Planning",
  "difficulty": "easy",
  "phase": "Workforce Planning",
  "phase_description": "Analyze current talent capability, forecast future needs, and identify gaps to align the workforce with strategic business goals.",
  "scenario_name": "Strategic Workforce Gap Analysis",
  "project_mandate": {
    "business_problem": "TechGrowth Inc. is expanding its AI division by 200% over the next 18 months. HR needs to ensure enough qualified talent serves this growth while managing attrition in legacy departments.",
    "high_level_goal": "Conduct a comprehensive workforce gap analysis to determine hire vs. build strategies for key AI roles and develop a transition plan for legacy staff.",
    "initial_budget": "4 months timeline. Budget: $200K for upskilling pilots and recruitment tooling. Access to HRIS, ATS, and market salary data."
  },
  "reference_materials": {
    "key_concepts": [
      "Talent Supply/Demand",
      "Skills Gap Analysis",
      "Attrition Forecasting",
      "Buy vs. Build",
      "Succession Planning",
      "Strategic HR Alignment"
    ],
    "visual_model": {
      "name": "Workforce Planning Model",
      "description": "The 4-step cycle: Analyze Supply, Forecast Demand, Gap Analysis, and Strategy Formulation (Buy, Build, Borrow, Bot, Bind).",
      "svg": "<svg width=\"100%\" viewBox=\"0 0 400 220\" style=\"margin-top: 0.5rem;\" aria-labelledby=\"workforce-title\"><title id=\"workforce-title\">Workforce Planning Cycle</title><g style=\"font-family: sans-serif;\"><rect x=\"10\" y=\"10\" width=\"380\" height=\"30\" fill=\"#00385C\" stroke=\"#38BDF8\" stroke-width=\"2\" rx=\"4\"></rect><text x=\"200\" y=\"30\" text-anchor=\"middle\" style=\"font-size: 14px; fill: #98D048; font-weight: bold;\">STRATEGIC GOALS</text><rect x=\"20\" y=\"60\" width=\"80\" height=\"100\" fill=\"#0B1E32\" stroke=\"#38BDF8\" stroke-width=\"1\" rx=\"4\"></rect><text x=\"60\" y=\"80\" text-anchor=\"middle\" style=\"font-size: 10px; fill: #38BDF8; font-weight: bold;\">SUPPLY</text><text x=\"60\" y=\"100\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #fff;\">Current Staff</text><text x=\"60\" y=\"115\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #fff;\">Skills Inventory</text><text x=\"60\" y=\"130\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #fff;\">Turnover Rate</text><rect x=\"110\" y=\"60\" width=\"80\" height=\"100\" fill=\"#0B1E32\" stroke=\"#38BDF8\" stroke-width=\"1\" rx=\"4\"></rect><text x=\"150\" y=\"80\" text-anchor=\"middle\" style=\"font-size: 10px; fill: #38BDF8; font-weight: bold;\">DEMAND</text><text x=\"150\" y=\"100\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #fff;\">Future Roles</text><text x=\"150\" y=\"115\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #fff;\">Growth Plans</text><text x=\"150\" y=\"130\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #fff;\">Tech Changes</text><rect x=\"200\" y=\"60\" width=\"80\" height=\"100\" fill=\"#0B1E32\" stroke=\"#EF4444\" stroke-width=\"2\" rx=\"4\"></rect><text x=\"240\" y=\"80\" text-anchor=\"middle\" style=\"font-size: 10px; fill: #EF4444; font-weight: bold;\">GAP</text><text x=\"240\" y=\"100\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #fff;\">Shortages</text><text x=\"240\" y=\"115\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #fff;\">Surpluses</text><text x=\"240\" y=\"130\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #fff;\">Skill Mismatch</text><rect x=\"290\" y=\"60\" width=\"90\" height=\"100\" fill=\"#0B1E32\" stroke=\"#98D048\" stroke-width=\"2\" rx=\"4\"></rect><text x=\"335\" y=\"80\" text-anchor=\"middle\" style=\"font-size: 10px; fill: #98D048; font-weight: bold;\">ACTION</text><text x=\"335\" y=\"100\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #fff;\">Buy (Hire)</text><text x=\"335\" y=\"115\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #fff;\">Build (Train)</text><text x=\"335\" y=\"130\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #fff;\">Borrow/Bind</text><path d=\"M 60 160 L 60 180 L 150 180 L 150 160\" fill=\"none\" stroke=\"#38BDF8\" stroke-width=\"1\" stroke-dasharray=\"4 2\"></path><text x=\"105\" y=\"190\" text-anchor=\"middle\" style=\"font-size: 9px; fill: #38BDF8; font-style: italic;\">Net Difference Calculation</text></g></svg>"
    }
  },
  "questions": [
    {
      "question_id": 1,
      "question_text": "The CTO wants to hire 50 new AI Engineers immediately. As an HR Manager, what is your first step?",
      "options": [
        {
          "option_id": "A",
          "text": "Post 50 job descriptions on LinkedIn.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Analyze internal capability vs. external needs (Buy vs. Build Analysis).",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "Tell the CTO it's impossible.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "Hire a recruitment agency immediately.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 2,
      "question_text": "You forecast a surplus of 30 Project Managers in legacy departments next year. What is the most strategic HR response?",
      "options": [
        {
          "option_id": "A",
          "text": "Lay them all off immediately.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Reskill them for growing roles like Product Owner (Redeployment).",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "Wait until next year to act.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "Assign them to random teams.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 3,
      "question_text": "High turnover (25%) is predicted for Junior Developers. What metric should you primarily track to validate this risk?",
      "options": [
        {
          "option_id": "A",
          "text": "Number of coffee breaks.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Code lines written.",
          "is_correct": false
        },
        {
          "option_id": "C",
          "text": "Employee Net Promoter Score (eNPS) and Engagement trends.",
          "is_correct": true
        },
        {
          "option_id": "D",
          "text": "Overall company revenue.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 4,
      "question_text": "When calculating the 'Total Cost of Workforce', which factor is often overlooked but critical?",
      "options": [
        {
          "option_id": "A",
          "text": "Base Salary.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Indirect costs like 'Cost of Vacancy' and onboarding time.",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "Office rent.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "Software licenses.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 5,
      "question_text": "Stakeholders demand 'more agile' hiring. What does this imply for your Workforce Plan?",
      "options": [
        {
          "option_id": "A",
          "text": "Skip interviews.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Hire anyone who applies.",
          "is_correct": false
        },
        {
          "option_id": "C",
          "text": "Reviewing talent needs quarterly instead of annually.",
          "is_correct": true
        },
        {
          "option_id": "D",
          "text": "Hiring only contractors.",
          "is_correct": false
        }
      ]
    }
  ]
},
      {
  "scenario_id": 2,
  "skill_name": "HR Data Quality",
  "difficulty": "easy",
  "phase": "HR Data Quality",
  "phase_description": "Assess the reliability, completeness, and consistency of people data stored in HRIS and other systems.",
  "scenario_name": "Cleansing the Employee Master Data",
  "project_mandate": {
    "business_problem": "A recent payroll audit revealed discrepancies in employee records. The CHRO suspects data quality issues in the HRIS (Workday) affecting compliance and reporting.",
    "high_level_goal": "Profile the Employee Master Data to identify quality gaps (missing fields, inconsistencies, duplicates) and establish a remediation plan.",
    "initial_budget": "2 weeks. Access to anonymized HRIS export (5,000 records). Tools: Excel/PowerBI for profiling."
  },
  "reference_materials": {
    "key_concepts": [
      "Data Profiling",
      "Data Governance",
      "Single Source of Truth",
      "Data Dictionary",
      "Privacy (GDPR/PII)",
      "Validity & Completeness"
    ],
    "visual_model": {
      "name": "HR Data Quality Dimensions",
      "description": "The 6 pillars of data quality in HR context: Accuracy, Completeness, Consistency, Timeliness, Validity, Uniqueness.",
      "svg": "<svg width=\"100%\" viewBox=\"0 0 400 220\" style=\"margin-top: 0.5rem;\" aria-labelledby=\"quality-title\"><title id=\"quality-title\">HR Data Quality Dimensions</title><g style=\"font-family: sans-serif;\"><circle cx=\"200\" cy=\"110\" r=\"80\" fill=\"#00385C\" stroke=\"#38BDF8\" stroke-width=\"3\"></circle><text x=\"200\" y=\"115\" text-anchor=\"middle\" style=\"font-size: 12px; fill: #98D048; font-weight: bold;\">QUALITY HR DATA</text><g transform=\"translate(200, 30)\"><circle cx=\"0\" cy=\"0\" r=\"28\" fill=\"#0B1E32\" stroke=\"#98D048\" stroke-width=\"2\"></circle><text x=\"0\" y=\"5\" text-anchor=\"middle\" style=\"font-size: 9px; fill: #fff; font-weight: bold;\">Accuracy</text></g><g transform=\"translate(280, 70)\"><circle cx=\"0\" cy=\"0\" r=\"28\" fill=\"#0B1E32\" stroke=\"#98D048\" stroke-width=\"2\"></circle><text x=\"0\" y=\"5\" text-anchor=\"middle\" style=\"font-size: 9px; fill: #fff; font-weight: bold;\">Complete</text></g><g transform=\"translate(280, 150)\"><circle cx=\"0\" cy=\"0\" r=\"28\" fill=\"#0B1E32\" stroke=\"#98D048\" stroke-width=\"2\"></circle><text x=\"0\" y=\"5\" text-anchor=\"middle\" style=\"font-size: 9px; fill: #fff; font-weight: bold;\">Consistent</text></g><g transform=\"translate(200, 190)\"><circle cx=\"0\" cy=\"0\" r=\"28\" fill=\"#0B1E32\" stroke=\"#98D048\" stroke-width=\"2\"></circle><text x=\"0\" y=\"5\" text-anchor=\"middle\" style=\"font-size: 9px; fill: #fff; font-weight: bold;\">Timely</text></g><g transform=\"translate(120, 150)\"><circle cx=\"0\" cy=\"0\" r=\"28\" fill=\"#0B1E32\" stroke=\"#98D048\" stroke-width=\"2\"></circle><text x=\"0\" y=\"5\" text-anchor=\"middle\" style=\"font-size: 9px; fill: #fff; font-weight: bold;\">Valid</text></g><g transform=\"translate(120, 70)\"><circle cx=\"0\" cy=\"0\" r=\"28\" fill=\"#0B1E32\" stroke=\"#98D048\" stroke-width=\"2\"></circle><text x=\"0\" y=\"5\" text-anchor=\"middle\" style=\"font-size: 9px; fill: #fff; font-weight: bold;\">Unique</text></g></g></svg>"
    }
  },
  "questions": [
    {
      "question_id": 6,
      "question_text": "You notice that 'Department Name' is entered as 'Sales', 'Sales Dept', and 'Global Sales' for the same team. What data quality issue is this?",
      "options": [
        {
          "option_id": "A",
          "text": "Missing Data.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Consistency Issue (Requires standardization).",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "Security Breach.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "System Error.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 7,
      "question_text": "15% of employee records have a blank 'Manager ID'. Why is this a critical issue?",
      "options": [
        {
          "option_id": "A",
          "text": "It looks bad on reports.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "It breaks the organizational hierarchy and reporting lines.",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "Managers don't need IDs.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "IT can fix it later.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 8,
      "question_text": "You need to share employee data with an external benefits provider. What is your first check?",
      "options": [
        {
          "option_id": "A",
          "text": "Send the Excel file immediately.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Verify data minimization and GDPR/PII compliance.",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "Zip the file with a weak password.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "Ask the vendor what they want.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 9,
      "question_text": "Duplicate employee profiles exist because re-hires were created as new records. How do you resolve this?",
      "options": [
        {
          "option_id": "A",
          "text": "Delete the old records.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Merge records under a unique Employee ID to maintain history.",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "Keep both records active.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "Ignore the history.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 10,
      "question_text": "An executive asks for a headcount report 'as of today'. Your data is updated monthly. What do you do?",
      "options": [
        {
          "option_id": "A",
          "text": "Send last month's data without comment.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Make up estimates.",
          "is_correct": false
        },
        {
          "option_id": "C",
          "text": "Provide the latest confirmed data and clarify the 'Timeliness' limitation.",
          "is_correct": true
        },
        {
          "option_id": "D",
          "text": "Manually count people in the office.",
          "is_correct": false
        }
      ]
    }
  ]
},
      {
  "scenario_id": 3,
  "skill_name": "Turnover Analysis",
  "difficulty": "medium",
  "phase": "Turnover Analysis",
  "phase_description": "Clean, transform, and integrate people data to prepare for predictive churn modeling.",
  "scenario_name": "Preparing the Attrition Dataset",
  "project_mandate": {
    "business_problem": "Data quality is now better, but you need to combine data from the ATS (hiring info), HRIS (demographics), and Engagement Survey (scores) to analyze why people are leaving.",
    "high_level_goal": "Create a unified 'Employee Churn' dataset. Handle missing survey data, calculate 'Tenure' and 'Time since promotion', and identify high-flight-risk segments.",
    "initial_budget": "3 weeks. Deliverable: Integrated dataset ready for analysis. Tools: SQL/Python."
  },
  "reference_materials": {
    "key_concepts": [
      "Survival Analysis (Time-to-Event)",
      "Feature Engineering (Tenure, Comp Ratio)",
      "Correlation vs Causation",
      "One-Hot Encoding",
      "Missing Data Imputation",
      "Cohort Analysis"
    ],
    "visual_model": {
      "name": "Turnover Analysis Pipeline",
      "description": "Workflow: Join Data → Feature Engineering (Tenure, Comp Gap) → Label Creation (Churned Y/N) → Analysis.",
      "svg": "<svg width=\"100%\" viewBox=\"0 0 400 180\" style=\"margin-top: 0.5rem;\" aria-labelledby=\"pipeline-title\"><title id=\"pipeline-title\">Turnover Data Pipeline</title><g style=\"font-family: sans-serif;\"><rect x=\"10\" y=\"60\" width=\"60\" height=\"60\" fill=\"#0B1E32\" stroke=\"#EF4444\" stroke-width=\"2\" rx=\"4\"></rect><text x=\"40\" y=\"85\" text-anchor=\"middle\" style=\"font-size: 9px; fill: #EF4444; font-weight: bold;\">RAW</text><text x=\"40\" y=\"98\" text-anchor=\"middle\" style=\"font-size: 9px; fill: #EF4444; font-weight: bold;\">SOURCES</text><path d=\"M 75 90 L 95 90\" stroke=\"#38BDF8\" stroke-width=\"2\" marker-end=\"url(#arrow)\"></path><rect x=\"100\" y=\"60\" width=\"55\" height=\"60\" fill=\"#0B1E32\" stroke=\"#38BDF8\" stroke-width=\"2\" rx=\"4\"></rect><text x=\"127\" y=\"85\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #38BDF8; font-weight: bold;\">Join</text><text x=\"127\" y=\"98\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #38BDF8;\">• HRIS</text><text x=\"127\" y=\"108\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #38BDF8;\">• ATS/Perf</text><path d=\"M 160 90 L 180 90\" stroke=\"#38BDF8\" stroke-width=\"2\" marker-end=\"url(#arrow)\"></path><rect x=\"185\" y=\"60\" width=\"55\" height=\"60\" fill=\"#0B1E32\" stroke=\"#38BDF8\" stroke-width=\"2\" rx=\"4\"></rect><text x=\"212\" y=\"85\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #38BDF8; font-weight: bold;\">Features</text><text x=\"212\" y=\"98\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #38BDF8;\">• Tenure</text><text x=\"212\" y=\"108\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #38BDF8;\">• Comp Ratio</text><path d=\"M 245 90 L 265 90\" stroke=\"#38BDF8\" stroke-width=\"2\" marker-end=\"url(#arrow)\"></path><rect x=\"270\" y=\"60\" width=\"55\" height=\"60\" fill=\"#0B1E32\" stroke=\"#38BDF8\" stroke-width=\"2\" rx=\"4\"></rect><text x=\"297\" y=\"85\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #38BDF8; font-weight: bold;\">Label</text><text x=\"297\" y=\"98\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #38BDF8;\">• Churn (1)</text><text x=\"297\" y=\"108\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #38BDF8;\">• Stay (0)</text><path d=\"M 330 90 L 350 90\" stroke=\"#98D048\" stroke-width=\"2\" marker-end=\"url(#arrow)\"></path><circle cx=\"375\" cy=\"90\" r=\"25\" fill=\"#001C2C\" stroke=\"#98D048\" stroke-width=\"3\"></circle><text x=\"375\" y=\"95\" text-anchor=\"middle\" style=\"font-size: 9px; fill: #98D048; font-weight: bold;\">READY</text></g></svg>"
    }
  },
  "questions": [
    {
      "question_id": 11,
      "question_text": "30% of employees have missing 'Exit Interview' data. Why shouldn't you just delete these rows?",
      "options": [
        {
          "option_id": "A",
          "text": "It reduces sample size.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "The pattern of missingness itself might be insight (e.g., involuntary terminations don't get interviews). Analyzing 'Active' employees requires these rows to compare against those who left.",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "HR wouldn't like it.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "You can fake the data.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 12,
      "question_text": "You want to measure the impact of salary on turnover. Why is 'Compa-Ratio' (Salary / Midpoint) better than raw 'Salary'?",
      "options": [
        {
          "option_id": "A",
          "text": "It's a bigger number.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "It hides real salaries.",
          "is_correct": false
        },
        {
          "option_id": "C",
          "text": "It normalizes for job level and geography, allowing you to see if an employee is underpaid relative to their specific role's market value, which is a stronger predictor of dissatisfaction.",
          "is_correct": true
        },
        {
          "option_id": "D",
          "text": "It's standard practice.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 13,
      "question_text": "Your dataset includes 'Department' as a text field (Sales, Eng, HR). How should you prepare this for a regression model?",
      "options": [
        {
          "option_id": "A",
          "text": "Delete the column.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Apply 'One-Hot Encoding' to create binary columns (Is_Sales, Is_Eng, Is_HR) so the algorithm can interpret categorical data without assigning false numerical rank.",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "Number them 1, 2, 3.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "Leave as text.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 14,
      "question_text": "You notice 'Time Since Promotion' is skewed (most people 0-2 years, some 10+). How does this affect analysis?",
      "options": [
        {
          "option_id": "A",
          "text": "It doesn't.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Create 'Log_Time_Promo' feature or bin the data (0-1, 1-3, 3+) to handle outliers, as extreme values might disproportionately influence the model's understanding of flight risk.",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "Delete employees > 5 years.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "Set max to 5 years.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 15,
      "question_text": "Before modeling, you validate the 'Tenure' calculation. What is a common error to check for?",
      "options": [
        {
          "option_id": "A",
          "text": "Negative tenure (Start Date > End Date/Today), which indicates data entry errors in the source HRIS system.",
          "is_correct": true
        },
        {
          "option_id": "B",
          "text": "Tenure > 1 year.",
          "is_correct": false
        },
        {
          "option_id": "C",
          "text": "Decimals in tenure.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "Zero tenure.",
          "is_correct": false
        }
      ]
    }
  ]
},
      {
  "scenario_id": 4,
  "skill_name": "Recruitment Funnel",
  "difficulty": "medium",
  "phase": "Recruitment Analytics",
  "phase_description": "Analyze the hiring pipeline to discover bottlenecks, improve conversion rates, and forecast time-to-fill.",
  "scenario_name": "Optimizing the Hiring Pipeline",
  "project_mandate": {
    "business_problem": "Strategic roles take 90+ days to fill. Candidates drop off after the 'Technical Interview' stage. Executives need to speed up hiring without lowering the bar.",
    "high_level_goal": "Analyze the recruitment funnel (Applications → Screen → Interview → Offer → Hire) to identify bottlenecks and predict time-to-fill for future roles.",
    "initial_budget": "4 weeks. Target: Reduce Time-to-Fill to 60 days. Tools: ATS Data Export, Python/Excel. Deliverable: Pipeline optimization report."
  },
  "reference_materials": {
    "key_concepts": [
      "Funnel Analysis",
      "Conversion Rates",
      "Time-to-Fill vs. Time-to-Hire",
      "Yield Ratios",
      "Cost-per-Hire",
      "Candidate Experience"
    ],
    "visual_model": {
      "name": "Recruitment Funnel Model",
      "description": "Stages of the funnel: Applicants → Screens → Interviews → Offers → Hires, with drop-off rates at each step.",
      "svg": "<svg width=\"100%\" viewBox=\"0 0 400 200\" style=\"margin-top: 0.5rem;\" aria-labelledby=\"funnel-title\"><title id=\"funnel-title\">Hiring Funnel</title><g style=\"font-family: sans-serif;\"><polygon points=\"50,20 350,20 300,180 100,180\" fill=\"#0B1E32\" stroke=\"#38BDF8\" stroke-width=\"2\"></polygon><line x1=\"63\" y1=\"60\" x2=\"337\" y2=\"60\" stroke=\"#38BDF8\" stroke-width=\"1\"></line><line x1=\"75\" y1=\"100\" x2=\"325\" y2=\"100\" stroke=\"#38BDF8\" stroke-width=\"1\"></line><line x1=\"88\" y1=\"140\" x2=\"312\" y2=\"140\" stroke=\"#38BDF8\" stroke-width=\"1\"></line><text x=\"200\" y=\"45\" text-anchor=\"middle\" style=\"font-size: 10px; fill: #fff;\">APPLICANTS (1000)</text><text x=\"200\" y=\"85\" text-anchor=\"middle\" style=\"font-size: 10px; fill: #fff;\">SCREENS (200)</text><text x=\"200\" y=\"125\" text-anchor=\"middle\" style=\"font-size: 10px; fill: #fff;\">INTERVIEWS (50)</text><text x=\"200\" y=\"165\" text-anchor=\"middle\" style=\"font-size: 10px; fill: #98D048; font-weight: bold;\">OFFERS (5)</text><text x=\"360\" y=\"60\" text-anchor=\"start\" style=\"font-size: 8px; fill: #EF4444;\">20% Conv</text><text x=\"360\" y=\"100\" text-anchor=\"start\" style=\"font-size: 8px; fill: #EF4444;\">25% Conv</text><text x=\"360\" y=\"140\" text-anchor=\"start\" style=\"font-size: 8px; fill: #EF4444;\">10% Conv</text></g></svg>"
    }
  },
  "questions": [
    {
      "question_id": 16,
      "question_text": "You notice high drop-off (60%) at the 'Application' stage (people start applying but don't finish). What data point helps you diagnose this?",
      "options": [
        {
          "option_id": "A",
          "text": "Salary listed in JD.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Time-to-Complete Application (signaling a lengthy/complex process).",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "Number of competitors.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "Color of the 'Submit' button.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 17,
      "question_text": "Managers say 'Recruiting is too slow'. Your data shows 'Time to Fill' is 45 days. Why might managers still feel it's slow?",
      "options": [
        {
          "option_id": "A",
          "text": "They are impatient.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "You are measuring 'Time to Fill', but they care about 'Time to Start' or 'Time to Slate'.",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "Data is wrong.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "Hiring is fast.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 18,
      "question_text": "We interview 20 candidates to make 1 offer (20:1 ratio). Industry benchmark is 8:1. What does this suggest?",
      "options": [
        {
          "option_id": "A",
          "text": "We are very selective, which is good.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Targeting inefficiency: we are interviewing too many unqualified candidates.",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "Interviewers are mean.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "Candidates are bad.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 19,
      "question_text": "Which metric best predicts a 'Quality Hire' before they even start?",
      "options": [
        {
          "option_id": "A",
          "text": "Years of experience.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Referral status (correlated with higher conversion and tenure).",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "College GPA.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "Interview suit quality.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 20,
      "question_text": "You want to forecast how many offers to extend to hit 10 hires. Your offer acceptance rate is 80%. How many offers do you need?",
      "options": [
        {
          "option_id": "A",
          "text": "10 offers.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "13 offers (12.5 rounded up).",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "20 offers.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "8 offers.",
          "is_correct": false
        }
      ]
    }
  ]
},
      {
  "scenario_id": 5,
  "skill_name": "Compensation Strategy",
  "difficulty": "medium",
  "phase": "Comp & Benefits",
  "phase_description": "Evaluate market competitiveness and internal equity to design a fair and motivating compensation strategy.",
  "scenario_name": "Redesigning the Pay Structure",
  "project_mandate": {
    "business_problem": "Employees are complaining about low pay, but the CFO says our 'Average Salary' is above market. You suspect averages are misleading and there are equity issues.",
    "high_level_goal": "Analyze salary distributions against market benchmarks (Compa-Ratios) and internal equity (Gender/Tenure gaps) to propose a budget-neutral adjustment plan.",
    "initial_budget": "2 weeks. Access to Salary Surveys and Payroll Data. Deliverable: Board Presentation on Compensation Health."
  },
  "reference_materials": {
    "key_concepts": [
      "Compa-Ratio",
      "Pay Bands/Grades",
      "Market Percentiles (P25, P50, P75)",
      "Internal Equity",
      "Total Rewards",
      "Merit Matrix"
    ],
    "visual_model": {
      "name": "Total Rewards Strategy",
      "description": "Balancing the 4 quadrants: Compensation (Pay), Benefits (Health/Time Off), Development (Career), and Environment (Culture).",
      "svg": "<svg width=\"100%\" viewBox=\"0 0 400 200\" style=\"margin-top: 0.5rem;\" aria-labelledby=\"reward-title\"><title id=\"reward-title\">Total Rewards Model</title><g style=\"font-family: sans-serif;\"><rect x=\"200\" y=\"20\" width=\"150\" height=\"150\" fill=\"none\" stroke=\"#38BDF8\" stroke-width=\"2\" transform=\"rotate(45 275 95)\"></rect><text x=\"200\" y=\"100\" text-anchor=\"middle\" style=\"font-size: 12px; fill: #98D048; font-weight: bold;\">EMPLOYEE VALUE</text><line x1=\"169\" y1=\"95\" x2=\"381\" y2=\"95\" stroke=\"#38BDF8\" stroke-width=\"1\"></line><line x1=\"275\" y1=\"-11\" x2=\"275\" y2=\"201\" stroke=\"#38BDF8\" stroke-width=\"1\"></line><text x=\"275\" y=\"40\" text-anchor=\"middle\" style=\"font-size: 10px; fill: #fff; font-weight: bold;\">COMPENSATION</text><text x=\"275\" y=\"55\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #fff;\">Base Analysis</text><text x=\"275\" y=\"65\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #fff;\">Incentives</text><text x=\"340\" y=\"100\" text-anchor=\"start\" style=\"font-size: 10px; fill: #fff; font-weight: bold;\"> BENEFITS</text><text x=\"340\" y=\"115\" text-anchor=\"start\" style=\"font-size: 8px; fill: #fff;\"> Health</text><text x=\"340\" y=\"125\" text-anchor=\"start\" style=\"font-size: 8px; fill: #fff;\"> Wellbeing</text><text x=\"275\" y=\"160\" text-anchor=\"middle\" style=\"font-size: 10px; fill: #fff; font-weight: bold;\">DEVELOPMENT</text><text x=\"275\" y=\"175\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #fff;\">Career Path</text><text x=\"275\" y=\"185\" text-anchor=\"middle\" style=\"font-size: 8px; fill: #fff;\">Training</text><text x=\"210\" y=\"100\" text-anchor=\"end\" style=\"font-size: 10px; fill: #fff; font-weight: bold;\">CULTURE </text><text x=\"210\" y=\"115\" text-anchor=\"end\" style=\"font-size: 8px; fill: #fff;\">Recognition </text><text x=\"210\" y=\"125\" text-anchor=\"end\" style=\"font-size: 8px; fill: #fff;\">Work-Life </text></g></svg>"
    }
  },
  "questions": [
    {
      "question_id": 21,
      "question_text": "The CFO claims 'Average Salary is $100k, so we are fine'. The Median is $80k. What does this tell you?",
      "options": [
        {
          "option_id": "A",
          "text": "The CFO is right.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Distribution is right-skewed; Median ($80k) better represents typical pay.",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "Everyone is rich.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "Math is broken.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 22,
      "question_text": "You find a gender pay gap of 5%. What is your immediate next step?",
      "options": [
        {
          "option_id": "A",
          "text": "Panic.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Run regression analysis against tenure/level to check for unexplained gaps.",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "Give everyone a raise.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "Hide the data.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 23,
      "question_text": "We want to target the 'P75' (75th percentile) of the market for Engineers. What does this strategy mean?",
      "options": [
        {
          "option_id": "A",
          "text": "We pay 75% of the market rate.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "We lead the market: Intent to pay more than 75% of competitors.",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "We hire 75 engineers.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "We pay average.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 24,
      "question_text": "Employees value 'Flexibility' more than a 2% raise. How do you quantify this trade-off?",
      "options": [
        {
          "option_id": "A",
          "text": "Guess.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Use 'Conjoint Analysis' to calculate the implicit dollar value (utility).",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "Give both.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "Ignore the survey.",
          "is_correct": false
        }
      ]
    },
    {
      "question_id": 25,
      "question_text": "A manager wants to give a 20% raise to a 'High Potential' employee who is already at the top of their pay band. What is the risk?",
      "options": [
        {
          "option_id": "A",
          "text": "No risk.",
          "is_correct": false
        },
        {
          "option_id": "B",
          "text": "Salary compression/inequity; consider one-time bonus or promotion instead.",
          "is_correct": true
        },
        {
          "option_id": "C",
          "text": "They will leave.",
          "is_correct": false
        },
        {
          "option_id": "D",
          "text": "It saves money.",
          "is_correct": false
        }
      ]
    }
  ]
},

       
    ]
  }
};

export const placementSuccessStories = [
//     {
//         id: 1,
//         name: 'Shwetha S.',
//         description: `After spending over two years in a role that didn’t excite me, I knew I needed a change, but with no tech background, the transition felt overwhelming. I applied to over 100 jobs and faced rejection after rejection, which was incredibly frustrating. That’s when I discovered LearnTube, and everything started to change.\n

// What made the difference for me was the customized learning plan that was perfectly tailored to my needs. I gained hands-on experience through real-world projects that helped me build practical skills. The expert mentorship I received helped me navigate the challenges of being a fresher, and the polished resume I created showcased my new skills in a way that impressed recruiters. On top of that, the interview preparation boosted my confidence and gave me the tools to succeed.\n

// Within just a month, I secured my dream role at Baker Hughes, with a 150% salary hike! It wasn’t easy, but I stayed committed, worked hard, and relentlessly upskilled. I’m truly grateful for the role LearnTube played in my journey.`,
//         videoUrl: 'https://youtu.be/0g9Ddz2ips8',
//         from: 'Customer Software Associate',
//         to: 'Data Engineer',
//         thumbNail: 'https://assets.learntube.ai/files/Academy%20bundle/Shwetha%20Image.png',
//         thumbNail2: 'https://assets.learntube.ai/files/Post%20Payment/Rectangle%205146%20(9).png?updatedAt=1706100044811',
//         companyLogo: 'https://assets.learntube.ai/files/Academy%20bundle/Shwetha%20Company.png',
//         companyModalLogo : 'https://assets.learntube.ai/files/Academy%20bundle/Modal%20icon%20(2).png',
//     },
    {
        id: 2,
        name: 'Ankit S.',
        description: `After 5+ years in pharma R&D, I felt stuck. Everyone around me was in the same role for years, and I knew I needed a change. I spent 18 months trying to learn data on my own — YouTube, PDFs, tutorials. But I wasn’t making progress.\n

That’s when I joined LearnTube.\n

With a personalized learning path tailored to my background, I completed 4 real-world projects in just 30 days, including a healthcare ML model that showcased my expertise. The results were immediate. A recruiter from a top investment firm reached out. No tests, no endless interviews — just one conversation about my work, followed by a 35% salary hike.\n

LearnTube didn’t just teach me. They helped me build work that got me noticed. If you’re stuck, take the leap. The right support makes all the difference.
`,
        videoUrl: 'https://youtube.com/shorts/OqqTNCIrKR0',
        from: 'Computer Engineer',
        to: 'Full Stack Developer',
        thumbNail: 'https://assets.learntube.ai/files/Academy%20bundle/Ankit%20Image.png',
        companyLogo: 'https://assets.learntube.ai/files/Academy%20bundle/Ankit%20Company.png',
        thumbNail2: 'https://assets.learntube.ai/files/Post%20Payment/Rectangle%205147.png?updatedAt=1706100149035',
        companyModalLogo : 'https://assets.learntube.ai/files/Academy%20bundle/Modal%20icon%20(3).png',
    },
    {
        id: 3,
        name: 'Selvam Pillai',
        description: `With over 8 years of experience, I realized that despite my practical background, I lacked a formal certification to stand out in the competitive job market. I discovered LearnTube by Career Ninja on Instagram and completed their “Recruitment” Certificate. The certification instantly boosted my credibility and opened up new opportunities.\n

After updating my LinkedIn and Naukri profiles with the certification, the response was overwhelming. I went from receiving 4-5 recruiter calls per week to 15-16, including from top MNCs like Intel, Solar Energy companies, and India’s First Insurance. It was clear that the certification made a significant impact on my job prospects.\n

LearnTube not only provided me with an industry-recognized certification but also offered structured learning and personalized support. Their guidance, along with help in crafting professional testimonials and branding, played a key role in enhancing my career.`,
        videoUrl: 'https://www.youtube.com/shorts/API2-cAB9hc',
        from: 'HR Executive',
        to: 'Sr. Recruitment Consultant',
        thumbNail: 'https://assets.learntube.ai/files/Academy%20bundle/Selvam%20Image.png',
        thumbNail2: 'https://assets.learntube.ai/files/Post%20Payment/Rectangle%205148.png?updatedAt=1706100206471',
        companyLogo: 'https://assets.learntube.ai/files/Academy%20bundle/Selvam%20Company.png',
        companyModalLogo : 'https://assets.learntube.ai/files/Academy%20bundle/Modal%20icon%20(4).png',
    },
    {
        id: 4,
        name: 'Saitrik C',
        description: `I had the skills, a gold medal in MSc Cyber Security and 2.5 years of experience in vulnerability management. But despite all this, I felt like growth was out of reach, and I was stuck in my role.\n

That’s when I decided to enroll in LearnTube. I wanted to truly assess where I stood and see if I could level up my skills. The structured learning and certification program helped me sharpen my expertise and gain new insights that set me apart in my field.\n

I cracked the certification, and it didn’t take long for my manager to notice the difference. During my performance appraisal, he acknowledged the value I was now bringing to the team.\n

The result? A 75% salary hike, from ₹9L to ₹16L, and I didn’t even have to change jobs. It wasn’t about moving companies, it was about how my current company saw me in a completely new light.`,
        videoUrl: 'https://www.youtube.com/shorts/aGfFzUIvAko',
        from: 'Associate',
        to: 'Consultant Vulnerability Researcher',
        thumbNail: 'https://assets.learntube.ai/files/Academy%20bundle/Saitrik%20Image.png',
        thumbNail2: 'https://assets.learntube.ai/files/Post%20Payment/Rectangle%205149.png?updatedAt=1706100257026',
        companyLogo: 'https://assets.learntube.ai/files/Academy%20bundle/Saitrik%20Company.png',
        companyModalLogo : 'https://assets.learntube.ai/files/Academy%20bundle/Modal%20icon%20(5).png',
    },
    {
        id: 5,
        name: 'Bhavmeet Kaur',
        description: `As a Senior Executive in Digital Marketing at Ablysoft, I recognized the need to elevate my skills for career advancement. Discovering LearnTube, a renowned learning platform, I focused on strengthening my SEO expertise to boost my prospects in placement interviews. LearnTube's video-based courses offered flexibility, allowing me to revise and enhance my knowledge at my convenience. The interactive learning approach made the process enjoyable.\n

Delving into LearnTube's SEO courses increased my confidence. Emphasizing practice and real-world applications, the platform enabled me to grasp concepts with clarity. Well-prepared, I faced interviews with confidence, securing a Management Trainee position at Reliance Retail. Joining on July 3, 2023, with a 24 LPA salary, this journey from Ablysoft to LearnTube and finally to Reliance Retail signifies growth, self-improvement, and determination. Grateful to LearnTube for the transformative learning experience that opened doors to this remarkable opportunity.`,
        videoUrl: 'https://www.youtube.com/shorts/kf0sz6k4S3U',
        from: 'Digital Marketing Executive',
        to:'Business Ops. Manager',
        thumbNail: 'https://assets.learntube.ai/files/Academy%20bundle/Bhavmeet%20image.png',
        thumbNail2: 'https://assets.learntube.ai/files/Post%20Payment/Rectangle%205150.png?updatedAt=1706100314081',
        companyLogo: 'https://assets.learntube.ai/files/Academy%20bundle/Bhavmeet%20Company.png',
        companyModalLogo : 'https://assets.learntube.ai/files/Academy%20bundle/Modal%20icon%20(7).png',

    },
    {
        id: 6,
        name: 'Dr. Pritish',
        description:`During my final year of MBBS, I juggled various roles, including founding my startup, Fidorhealth, while holding prestigious positions like National IT Director at AMSA and Vice President at GAIM. To expand my digital reach and impact, I explored SEO and digital marketing, and that's when I found LearnTube. It offered free, high-quality content and valuable certificates, becoming my go-to platform.\n

 LearnTube's budget-friendly yet comprehensive content covered everything I needed to know, from digital marketing to mastering interview techniques. Despite facing personal challenges with cancer, I persevered and was honored by the Indian Book of Records. Thanks to LearnTube, I achieved financial success and now earn 10 LPA, realizing that continuous learning and staying updated are vital for sustained success.`,
        videoUrl: 'https://youtu.be/KKpDsm0PPSc',
        from: 'Student',
        to: 'Co-Founder',
        thumbNail: 'https://assets.learntube.ai/files/Academy%20bundle/Pritish%20Image.png',
        thumbNail2: 'https://assets.learntube.ai/files/Post%20Payment/Rectangle%205151.png?updatedAt=1706100362879',
        companyLogo: 'https://assets.learntube.ai/files/Academy%20bundle/Pritish%20Company.png',
        companyModalLogo : 'https://assets.learntube.ai/files/Academy%20bundle/Modal%20icon%20(8).png',
    },
    {
        id: 7,
        name: 'Dasharath Shetty',
        description: `As an Oracle developer at TCS with 8 years of experience in the IT industry, my career was at a crossroads, and I longed for a change. That's when I stumbled upon LearnTube, a game-changing platform. I dug into Python through LearnTube's comprehensive courses, mastering it from the basics to advanced concepts. The structured approach and practical examples fueled my learning journey.\n

Coding slowly became my second nature, and I felt more confident than ever before. With my newfound knowledge, I landed a job with a lucrative salary of 15 LPA, thanks to LearnTube. Now, I'm reentering the IT industry with updated skills and expertise, all thanks to LearnTube's guidance and practical knowledge.
`,
        videoUrl: 'https://youtube.com/shorts/Fkk68_W4b90',
        from: 'Salesforce Analyst',
        to: 'Sr. Product Analyst',
        thumbNail: 'https://assets.learntube.ai/files/Academy%20bundle/Dasharath%20Image.png',
        thumbNail2: 'https://assets.learntube.ai/files/Post%20Payment/Rectangle%205152.png?updatedAt=1706100433715',
        companyLogo: 'https://assets.learntube.ai/files/Academy%20bundle/Dashrath%20Company.png',
        companyModalLogo : 'https://assets.learntube.ai/files/Academy%20bundle/Modal%20icon%20(9).png',
    },
    {
        id: 9,
        name: 'Papia Chakraborty',
        description: `In June 2022, I embarked on my entrepreneurial journey, founding CUREASURE, an Assam-based startup, armed with 7 years of digital marketing experience and Photoshop proficiency. As the sole person handling everything, I knew continuous growth was vital.\n

Discovering LearnTube was a revelation - it aligned perfectly with my goals of managing the startup while upgrading my skills. Their practical courses empowered me to build my website, resulting in a 60% increase in traffic retention.\n

With each earned certificate, my online presence soared - followers increased by 80 per month, and impressions reached over 200. Today, my startup flourishes, generating a monthly income of 5,000 to 10,000 rupees,proving that investing in knowledge and upskilling is the true path to success.`,
        videoUrl: 'https://youtu.be/IO8RJWDgvio',
        from: 'Sr. Executive Assistant',
        to: 'Operations Manager',
        thumbNail: 'https://assets.learntube.ai/files/Academy%20bundle/Papia%20Image.png',
        thumbNail2: 'https://assets.learntube.ai/files/Post%20Payment/Rectangle%205153.png?updatedAt=1706100491936',
        companyLogo: 'https://assets.learntube.ai/files/Academy%20bundle/Papia%20Company.png',
        companyModalLogo : 'https://assets.learntube.ai/files/Academy%20bundle/Modal%20icon%20(10).png',
    },
    {
        id: 10,
        name: 'Dinesh Gupta',
        description: `From facing financial hardships to becoming a self-made professional, my journey has been nothing short of inspiring. With a generous scholarship from Make a Difference (MAD), I pursued my college education. I switched to a BSc in Computer Science due to unaffordable engineering college fees.\n

In 2022, I stumbled upon LearnTube, which offered free education and job prospects. I seized the opportunity and focused on learning ML, C++, and advanced programming through webinars and resume-building sessions. Despite setbacks, I secured shortlisted opportunities from renowned companies like Goldman Sachs, Paypal, Mirae Asset Capital, Kalyan Jewellers, and Omniversity.\n

Eventually, I joined Mirae Asset Capital as a software developer in the capital market division. Earning 4.5 lakhs per annum with a 50,000 rupee bonus, I continue learning from LearnTube, preparing for my future. I've learned that challenges don't dictate our paths. With determination, education, and the willingness to learn, we can turn dreams into reality.
`,
        videoUrl: 'https://youtu.be/owPU14dLvqs',
        from: 'Developer',
        to: 'Software Developer',
        thumbNail: 'https://assets.learntube.ai/files/Academy%20bundle/Dinesh%20Image.png',
        thumbNail2: 'https://assets.learntube.ai/files/Post%20Payment/Rectangle%205154.png?updatedAt=1706100529885',
        companyLogo: 'https://assets.learntube.ai/files/Academy%20bundle/Dinesh%20Company.png',
        companyModalLogo : 'https://assets.learntube.ai/files/Academy%20bundle/Modal%20icon%20(1).png',
    },

    {
        id: 11,
        name: 'Meenakshi J.',
        description: `Juggling life as a mom, wife, and professional, I always dreamed of building a meaningful career in IT. But balancing responsibilities, facing rejections, and dealing with self-doubt wasn’t easy.\n

That’s when I found LearnTube. With their support, I sharpened my skills, revamped my CV, and built the confidence to aim higher. In just 27 days, I achieved my goal as a Data Scientist with a 30% salary hike!`,
        videoUrl: 'https://youtube.com/shorts/XzNJV9qZXa0',
        from: 'Associate',
        to: 'Data Scientist',
        thumbNail: 'https://assets.learntube.ai/files/Academy%20bundle/Meenakshi%20Image.png',
        thumbNail2: 'https://assets.learntube.ai/files/Post%20Payment/Rectangle%205146%20(9).png?updatedAt=1706100044811',
        companyLogo: 'https://assets.learntube.ai/files/Academy%20bundle/Meenakshi%20Company.png',
        companyModalLogo : 'https://assets.learntube.ai/files/Academy%20bundle/Modal%20icon%20(6).png',
    }
];

export const pointsTwo = [
   {
    id:1,
    title : 'Practice Interviews by Role & Domain',
    description : 'Practice interviews by role and domain to build your skills and confidence.'
   },
   {
    id:2,
    title : 'AI-Powered Feedback',
    description : 'Receive instant analysis for each response — speech, structure, confidence, and more.'
   },
   {
    id:3,
    title : 'Practice At Your Own Convenience',
    description :'Get trained anytime anywhere and fit this into your schedule'
   },
   {
    id:4,
    title : 'Tech + Aptitude Assesments',
    description : 'Sharpen your core concepts with assessments built for real hiring rounds',
   },
   {
    id:5,
    title : 'Track Your Placement Activities',
    description : 'Monitor job applications & interviews all in one place'
   }
];
