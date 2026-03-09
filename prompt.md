# Create Production-Ready Role: Process Automation Specialist

You are a specialized database engineer and content creator for a professional certification platform. Create a complete, production-ready role for **Process Automation Specialist** in the specialized-main Supabase database.
Focus: RPA and intelligent automation

Advanced RPA Development (AdvRPAx) - default (UiPath advanced skills)
Platform-Based Process Automation (PlatformRPAx) - default (Power Automate/RPA)
Robotic Process Automation Fundamentals (RPAFundX) - secondary (UiPath associate level)
Cross-Platform Automation Integration (AutoIntegX) - secondary
AI-Driven Intelligent Automation (AIAutoX) - ai


## 🎯 MISSION: Complete Role Creation

Create a fully functional role with ALL required database tables, professional content, and industry-standard frameworks. This role must be immediately production-ready with no placeholder content.

## 📋 STRICT REQUIREMENTS

### Database Structure Requirements:
- **roles** table: 1 record with professional content
- **role_certificates** table: EXACTLY 5 certificates with specific distribution
- **assessments** table: 1 assessment record
- **scenarios** table: EXACTLY 5 scenarios with professional content
- **questions** table: EXACTLY 25 questions (5 per scenario)
- **assessment_phases** table: EXACTLY 5 phases
- **role_landing_pages** table: 1 SEO-optimized landing page

### Certificate Distribution (MANDATORY):
- **2 certificates** with `type: 'default'` (order_index 1, 2)
- **2 certificates** with `type: 'secondary'` (order_index 3, 4)
- **1 certificate** with `type: 'ai'` (order_index 5)

### Fixed Pricing Structure (EXACT AMOUNTS):
- **Order 1 (default):** price: 99, original_price: 299
- **Order 2 (default):** price: 149, original_price: 349  
- **Order 3 (secondary):** price: 129, original_price: 329
- **Order 4 (secondary):** price: 119, original_price: 319
- **Order 5 (ai):** price: 159, original_price: 359

## 🔬 STEP 1: Industry Research & Analysis

First, analyze the Process Automation Specialist role:

### Research Requirements:
1. **Industry Frameworks:** Identify 5 real, widely-used industry frameworks/tools for this role (keep names short, 1-3 words)
2. **Core Skill:** Define the primary skill area (2-5 words)
3. **Professional Description:** Write a compelling 2-3 sentence role description
4. **Target Audience:** Identify who pursues this role
5. **Key Responsibilities:** List main job functions
6. **Industry Standards:** Research certification bodies, methodologies, tools

## 🏗️ STEP 2: Database Record Creation

### A. CREATE ROLES RECORD

```sql
INSERT INTO roles (
    role_name, 
    slug, 
    description, 
    core_skill, 
    frameworks, 
    status
) VALUES (
    'Process Automation Specialist',
    'generate-url-friendly-slug-here',
    'professional-description-here',
    'core-skill-area-here',
    '["Framework1", "Framework2", "Framework3", "Framework4", "Framework5"]',
    'published'
) RETURNING id;
```

**Requirements:**
- `slug`: lowercase, hyphens only, URL-friendly
- `description`: Professional, no marketing fluff, 2-3 sentences
- `core_skill`: Primary expertise area
- `frameworks`: EXACTLY 5 real industry frameworks
- `status`: MUST be 'published'

### B. CREATE 5 ROLE CERTIFICATES

For EACH certificate (1-5), create with these EXACT specifications:

**Certificate 1 (Default):**
```sql
INSERT INTO role_certificates (
    role_id,
    name,
    short_name, 
    cert_id_prefix,
    type,
    order_index,
    preview_image,
    description,
    certificate_name,
    price,
    original_price,
    badge,
    skill_frameworks
) VALUES (
    role_id_from_step_A,
    'Professional Certificate Name Here',
    'ShortNamex',
    'SHORTNAME',
    'default',
    1,
    'https://pndqvtuejuxanhzvuwoh.supabase.co/storage/v1/object/public/certificate-preview-optimized/preview-shortnameX.png',
    'Professional certificate description here',
    'Full Certificate Display Name Here',
    99,
    299,
    'Core Certification',
    '["Skill Framework 1", "Skill Framework 2", "Skill Framework 3"]'
);
```

**Naming Conventions:**
- `short_name`: Professional abbreviation + 'x' (e.g., PMPx, DevOpsx, DataAnalx)
- `cert_id_prefix`: ALL CAPS, no 'x' suffix
- `skill_frameworks`: EXACTLY 3 relevant skills per certificate
- `preview_image`: Use pattern with role-specific short_name

**Repeat for certificates 2-5 with:**
- Certificate 2: type='default', order_index=2, price=149, original_price=349, badge='Advanced Professional'
- Certificate 3: type='secondary', order_index=3, price=129, original_price=329, badge='Specialized Expertise'  
- Certificate 4: type='secondary', order_index=4, price=119, original_price=319, badge='Technical Mastery'
- Certificate 5: type='ai', order_index=5, price=159, original_price=359, badge='AI Innovation'

### C. CREATE ASSESSMENT

```sql
INSERT INTO assessments (
    role_id,
    name,
    status
) VALUES (
    role_id_from_step_A,
    'Process Automation Specialist Professional Assessment',
    'published'
) RETURNING id;
```

### D. CREATE 5 SCENARIOS

For EACH scenario (1-5), create realistic, industry-appropriate scenarios:

```sql
INSERT INTO scenarios (
    role_id,
    name,
    principle,
    context,
    challenge,
    task,
    key_concepts,
    visual_model,
    status,
    difficulty,
    skill_name,
    phase_number,
    phase,
    phase_description,
    project_mandate
) VALUES (
    role_id_from_step_A,
    'Scenario Name Here',
    'Core Principle Being Tested',
    'Professional business context here',
    'Realistic challenge the role faces',
    'Specific task to accomplish',
    '["Key Concept 1", "Key Concept 2", "Key Concept 3", "Key Concept 4", "Key Concept 5", "Key Concept 6"]',
    '{"svg": "PROFESSIONAL SVG DIAGRAM HERE WITH ESCAPED QUOTES"}',
    'published',
    'medium',
    'Relevant Skill Area',
    1,
    'Phase Name',
    'Phase description',
    '{"business_problem": "Problem description", "goal": "Objective", "budget": "Budget info"}'
);
```

**Critical Requirements:**
- `key_concepts`: EXACTLY 6 professional concepts
- `visual_model`: Must contain professional SVG with proper escaping
- `difficulty`: Use 'easy', 'medium', or 'hard'
- All content must be professional, no placeholder text

### E. CREATE 25 QUESTIONS (5 per scenario)

For EACH question, create realistic multiple-choice questions:

**CRITICAL: ENSURE ANSWER VARIETY**
- Distribute correct answers evenly across A, B, C, D
- Do NOT default to making B the correct answer
- Aim for roughly equal distribution: ~6-7 questions each with A, B, C, or D as correct

```sql
INSERT INTO questions (
    scenario_id,
    question_text,
    options
) VALUES (
    scenario_id_from_step_D,
    'Professional question text here?',
    '[
        {
            "text": "Option A text here",
            "option_id": "A", 
            "is_correct": false
        },
        {
            "text": "Option B text here",
            "option_id": "B",
            "is_correct": true
        },
        {
            "text": "Option C text here", 
            "option_id": "C",
            "is_correct": false
        },
        {
            "text": "Option D text here",
            "option_id": "D", 
            "is_correct": false
        }
    ]'
);
```

**Requirements:**
- EXACTLY 4 options per question
- EXACTLY 1 correct answer per question
- **ANSWER VARIETY REQUIRED**: Distribute correct answers evenly across A, B, C, D (approximately 25% each)
- **DO NOT default to B as the correct answer** - vary the position of correct answers
- Options must be realistic and professional
- Questions must test real professional knowledge

### F. CREATE 5 ASSESSMENT PHASES

```sql
INSERT INTO assessment_phases (
    assessment_id,
    order_index,
    scenario_id,
    name,
    description
) VALUES (
    assessment_id_from_step_C,
    1,
    scenario_id_1,
    'Phase 1 Name',
    'Phase 1 description'
);
```

**CRITICAL: Use order_index 1-5 (NOT 0-4)**
Repeat for phases 1-5, linking each to corresponding scenario:
- Phase 1: order_index = 1
- Phase 2: order_index = 2  
- Phase 3: order_index = 3
- Phase 4: order_index = 4
- Phase 5: order_index = 5

### G. CREATE ROLE LANDING PAGE

```sql
INSERT INTO role_landing_pages (
    role_id,
    slug,
    hero_title,
    hero_description,
    content,
    meta_title,
    meta_description,
    keywords
) VALUES (
    role_id_from_step_A,
    'role-slug-here',
    'Compelling Hero Title Here',
    'Engaging hero description that motivates enrollment',
    '{"scorecard_stats": [
        {"label": "Market Demand", "value": "High", "trend": "up"},
        {"label": "Avg Salary", "value": "$XXX,XXX", "trend": "up"}, 
        {"label": "Job Growth", "value": "XX%", "trend": "up"},
        {"label": "Remote Work", "value": "XX%", "trend": "up"},
        {"label": "Career Level", "value": "Senior", "trend": "stable"}
    ]}',
    'SEO-optimized title with role name and keywords',
    'SEO-friendly description for search engines',
    'relevant, keyword, phrases, separated, by, commas'
);
```

## ⚠️ CRITICAL FRONTEND COMPATIBILITY FIX

**IMPORTANT:** Assessment phases must use **1-indexed order_index values (1-5)**, NOT 0-indexed (0-4).

The frontend expects phases numbered 1-5:
- Phase 1: order_index = 1
- Phase 2: order_index = 2
- Phase 3: order_index = 3  
- Phase 4: order_index = 4
- Phase 5: order_index = 5

**Failure to use 1-5 indexing will cause "loading quia questions" errors on Phase 5.**

## 🎨 CONTENT QUALITY STANDARDS
- **NO placeholder text** - All content must be real and professional
- **Industry-appropriate language** - Use terminology professionals in this field would recognize
- **Realistic scenarios** - Base on actual challenges the role faces
- **Quality questions** - Test genuine professional knowledge
- **Professional visuals** - SVG diagrams must be meaningful and well-designed

### SVG Visual Model Requirements:
- Use professional color palette: #00385C, #38BDF8, #98D048, #0B1E32, #EF4444, #F59E0B
- All double quotes in SVG must be escaped with `\"`
- Diagrams should illustrate relevant concepts for the scenario
- Minimum size: 400x300, maximum size: 800x600

## ✅ VALIDATION CHECKLIST

Before completing, verify:

### Database Counts:
- [ ] 1 role record created
- [ ] 5 certificate records created (2 default, 2 secondary, 1 ai)
- [ ] 1 assessment record created  
- [ ] 5 scenario records created
- [ ] 25 question records created (5 per scenario)
- [ ] 5 assessment phase records created (order_index 1-5, NOT 0-4)
- [ ] 1 role landing page created

### Content Quality:
- [ ] All descriptions are professional and industry-appropriate
- [ ] No placeholder text anywhere
- [ ] All frameworks are real industry standards
- [ ] All scenarios are realistic business situations
- [ ] All questions test genuine professional knowledge
- [ ] **Answer distribution is balanced across A, B, C, D (approximately 25% each)**
- [ ] **No bias toward option B as the correct answer**
- [ ] SVG diagrams are professional and relevant

### Technical Requirements:
- [ ] All foreign key relationships properly established
- [ ] Pricing follows exact tier structure
- [ ] Certificate types follow required distribution
- [ ] All required fields populated
- [ ] Status fields set to 'published'

## 🚀 EXECUTION

Execute the database operations using the Supabase MCP server on the specialized-main database. Create all records in the correct sequence, maintaining foreign key relationships.

After successful creation, provide a summary showing:
- Role ID created
- Certificate IDs created  
- Assessment ID created
- Scenario IDs created
- Total questions created
- Landing page created

**REMEMBER: This role must be immediately production-ready with professional content throughout. No placeholders, no "TODO" items, no generic content.**

---

**Ready to create Process Automation Specialist? Execute this plan now!**