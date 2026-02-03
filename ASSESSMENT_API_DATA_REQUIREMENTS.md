# Assessment API Data Requirements for Data Analytics

## Overview
The Assessment Page has been updated for Data Analytics professionals. The frontend now expects scenarios and questions related to data analytics phases instead of project management phases.

## Updated Frontend Phase Structure

### New Phases (Based on CRISP-DM Methodology)
1. **Business Understanding** - Understanding business objectives and requirements
2. **Data Understanding** - Initial data collection and exploration
3. **Data Preparation** - Data cleaning, transformation, and feature engineering
4. **Modeling & Analysis** - Applying analytical techniques and building models
5. **Evaluation & Insights** - Assessing results and deriving actionable insights

### Progress Bar Labels
- Business
- Data
- Prepare
- Model
- Evaluate

---

## API Endpoint: `/bundle-scenarios` or similar

The frontend fetches scenario data via `fetchBundleScenarios(bundleId)`. The response should contain data analytics scenarios for each phase.

### Expected Response Structure

```typescript
interface ScenariosResponse {
  data: {
    scenarios: Scenario[];
  };
}

interface Scenario {
  scenario_id: number;          // 1-5 (phase number)
  scenario_name: string;         // e.g., "Business Understanding"
  skill_name: string;            // e.g., "Requirements Analysis"
  
  // Scenario briefing data
  project_mandate: {
    business_problem: string;    // Main scenario description
    high_level_goal: string;     // Task description
    initial_budget: string;      // Can be repurposed for context info
  };
  
  phase_description: string;     // Challenge description
  
  // Quiz questions
  questions: Question[];
  
  // Reference materials
  reference_materials: {
    key_concepts: string[];      // Array of key terms
    visual_model?: {
      name: string;
      description: string;
      svg?: string;              // Optional SVG diagram
    };
  };
}

interface Question {
  question_id: number;
  question_text: string;
  options: {
    text: string;
    is_correct: boolean;
  }[];
}
```

---

## Content Requirements by Phase

### Phase 1: Business Understanding
**Scenario Context:**
- Understanding stakeholder requirements
- Defining success metrics
- Identifying data sources
- Assessing feasibility

**Example Scenario:**
> A retail company wants to reduce customer churn. As a Data Analyst, you need to understand the business problem, identify key metrics, and determine what data would be needed.

**Key Concepts to Include:**
- Stakeholder Analysis
- Business Requirements
- Success Metrics (KPIs)
- Data Requirements Gathering
- SMART Objectives
- Problem Definition

**Sample Visual Model:** Stakeholder mapping or Requirements hierarchy

---

### Phase 2: Data Understanding
**Scenario Context:**
- Initial data collection
- Data exploration and profiling
- Identifying data quality issues
- Understanding data relationships

**Example Scenario:**
> You've been given access to 3 years of customer transaction data, demographic data, and support tickets. Perform initial exploration to understand the data structure and quality.

**Key Concepts to Include:**
- Data Profiling
- Exploratory Data Analysis (EDA)
- Data Quality Dimensions
- Descriptive Statistics
- Data Dictionary
- DAMA-DMBOK Framework

**Sample Visual Model:** Data flow diagram or Entity-Relationship diagram

---

### Phase 3: Data Preparation
**Scenario Context:**
- Data cleaning and validation
- Feature engineering
- Data transformation
- Handling missing values and outliers

**Example Scenario:**
> The customer dataset has 15% missing values in the "income" column, duplicates, and inconsistent date formats. Clean and prepare the data for analysis.

**Key Concepts to Include:**
- Data Cleaning Techniques
- Missing Value Treatment
- Outlier Detection
- Feature Engineering
- Data Normalization
- ETL Processes
- Data Validation Rules

**Sample Visual Model:** Data preparation pipeline or Decision tree for handling missing data

---

### Phase 4: Modeling & Analysis
**Scenario Context:**
- Selecting appropriate analytical techniques
- Applying statistical methods
- Building predictive models
- Hypothesis testing

**Example Scenario:**
> Using the prepared data, identify the top factors contributing to customer churn and build a model to predict at-risk customers.

**Key Concepts to Include:**
- Statistical Analysis
- Correlation vs Causation
- Predictive Modeling
- Model Selection
- Feature Importance
- CRISP-DM Methodology
- Hypothesis Testing
- A/B Testing

**Sample Visual Model:** Model evaluation framework or Statistical test decision tree

---

### Phase 5: Evaluation & Insights
**Scenario Context:**
- Model evaluation and validation
- Deriving actionable insights
- Creating visualizations
- Communicating findings

**Example Scenario:**
> Your churn prediction model shows 82% accuracy. Evaluate the model's performance, extract key insights, and prepare recommendations for the business team.

**Key Concepts to Include:**
- Model Evaluation Metrics
- Confusion Matrix
- ROC-AUC
- Data Visualization Best Practices
- Insight Generation
- Business Recommendations
- Storytelling with Data
- Dashboard Design

**Sample Visual Model:** Model performance dashboard or Insight communication framework

---

## Questions Format

Each phase should have **5 questions** that test real-world decision-making abilities.

### Question Types to Include:
1. **Analytical Thinking** - Interpreting data patterns
2. **Technical Knowledge** - Understanding frameworks and tools
3. **Problem Solving** - Choosing appropriate methods
4. **Best Practices** - Following data analytics standards
5. **Business Context** - Applying analytics to business needs

### Example Question Structure:

```json
{
  "question_id": 1,
  "question_text": "Given a dataset with 30% missing values in a critical feature, what is the BEST approach before deciding on a treatment method?",
  "options": [
    {
      "text": "Immediately remove all rows with missing values to ensure clean data",
      "is_correct": false
    },
    {
      "text": "Analyze the pattern of missingness (MCAR, MAR, MNAR) and assess the impact on your analysis goals",
      "is_correct": true
    },
    {
      "text": "Fill all missing values with the mean to maintain dataset size",
      "is_correct": false
    },
    {
      "text": "Replace missing values with zeros as a neutral value",
      "is_correct": false
    }
  ]
}
```

---

## Visual Models

Visual models help learners understand complex concepts. For each phase, provide:

### Recommended Visual Model Types:

1. **Business Understanding:** 
   - Stakeholder map
   - Problem definition framework
   - Analytics project lifecycle

2. **Data Understanding:**
   - Data flow diagrams
   - ER diagrams
   - Data quality dimensions chart

3. **Data Preparation:**
   - ETL pipeline
   - Data transformation workflow
   - Feature engineering process

4. **Modeling & Analysis:**
   - CRISP-DM cycle
   - Model selection decision tree
   - Statistical test flowchart

5. **Evaluation & Insights:**
   - Model evaluation framework
   - Dashboard wireframe
   - Insight-to-action framework

### SVG Format (Optional)
If providing SVGs, ensure they:
- Are lightweight (< 50KB)
- Use readable fonts
- Have clear labels
- Work on dark backgrounds (use light colors)
- Are responsive (use viewBox)

---

## Key Frameworks to Reference

Throughout all phases, questions and scenarios should reference these global frameworks:

### 1. **DAMA-DMBOK** (Data Management Body of Knowledge)
- Data governance principles
- Data quality management
- Metadata management
- Data architecture

### 2. **CRISP-DM** (Cross-Industry Standard Process for Data Mining)
- Business Understanding
- Data Understanding
- Data Preparation
- Modeling
- Evaluation
- Deployment

### Additional Standards:
- IIBA BABOK (Business Analysis Body of Knowledge)
- Statistical best practices
- Data visualization principles
- SQL and database standards

---

## Example Complete Scenario (Phase 3: Data Preparation)

```json
{
  "scenario_id": 3,
  "scenario_name": "Data Preparation",
  "skill_name": "Data Cleaning & Transformation",
  "project_mandate": {
    "business_problem": "An e-commerce company has provided you with 2 years of customer transaction data from multiple sources (website logs, CRM system, and payment gateway). The data needs to be consolidated and cleaned for a customer segmentation analysis.",
    "high_level_goal": "Prepare a clean, integrated dataset that can be used for customer segmentation and analysis. Ensure data quality meets business requirements.",
    "initial_budget": "3 databases, 2.5M records total, 45 columns"
  },
  "phase_description": "The data has quality issues including: duplicate customer records, inconsistent date formats, missing email addresses (20%), negative transaction amounts, and mismatched customer IDs across systems.",
  "questions": [
    {
      "question_id": 1,
      "question_text": "What should be your FIRST step in addressing the duplicate customer records?",
      "options": [
        {"text": "Delete all duplicates keeping only the first occurrence", "is_correct": false},
        {"text": "Analyze the nature of duplicates to understand why they exist and define merge logic", "is_correct": true},
        {"text": "Ignore duplicates and proceed with analysis", "is_correct": false},
        {"text": "Create a new unique ID for each record", "is_correct": false}
      ]
    },
    // ... 4 more questions
  ],
  "reference_materials": {
    "key_concepts": [
      "Data Quality Dimensions",
      "ETL Process",
      "Data Validation Rules",
      "Feature Engineering",
      "Data Normalization",
      "DAMA-DMBOK"
    ],
    "visual_model": {
      "name": "Data Preparation Pipeline",
      "description": "A systematic approach to cleaning and transforming raw data into analysis-ready format",
      "svg": "<svg>...</svg>"
    }
  }
}
```

---

## Backend Implementation Checklist

- [ ] Create 5 data analytics scenarios (one per phase)
- [ ] Each scenario has realistic business context
- [ ] Each scenario has 5 well-designed questions
- [ ] Questions test practical decision-making, not just theory
- [ ] Reference materials include relevant key concepts
- [ ] Visual models are provided (or placeholders)
- [ ] All content references DAMA-DMBOK and CRISP-DM frameworks
- [ ] Questions have clear correct/incorrect answers with reasoning
- [ ] Scenarios reflect real-world data analytics challenges
- [ ] Difficulty progresses appropriately across phases

---

## Testing Scenarios

After implementation, test with:
1. A junior data analyst (should score 50-60%)
2. A mid-level data analyst (should score 70-80%)
3. A senior data analyst (should score 85-95%)

Adjust question difficulty based on these benchmarks.

---

**Status**: Frontend ready, awaiting backend scenario data
**Last Updated**: 2026-01-23
**Contact**: Development team for questions
