# User Flow and Mixpanel Event Tracking

This document outlines the complete user flow for the Specialized Assessment application and defines the Mixpanel events to be tracked at each step.

## User Flow Overview

1.  **Homepage** (`/`)
    *   User lands on the page.
    *   User searches for a desired professional role or selects from popular roles.
    *   User clicks "Generate My Assessment".
2.  **Role Page** (`/?role=[Role Name]`)
    *   User views the personalized role details, skills framework, and benefits.
    *   User clicks "Begin Assessment Now".
3.  **Skill Selection** (`/select-skills`)
    *   User selects specific skills/certifications they want to be assessed on.
    *   User clicks "Continue".
4.  **Assessment** (`/assessment`)
    *   User waits for AI to generate scenarios (Loading Screen).
    *   User completes multiple phases (Scenarios), usually 6 phases.
    *   User answers quiz questions for each scenario.
    *   User completes the assessment.
5.  **Lead Generation** (`/contact-details`)
    *   User provides Name, Email, and Phone number to unlock results.
6.  **Results & Upsell** (`/results`)
    *   User views their Score, AI Summary, and Performance Breakdown.
    *   (If Qualified) User is presented with certification purchase options (Bundle or Individual).
    *   User initiates payment via Razorpay.
7.  **Post-Purchase** (`/payment-success`)
    *   User views success confirmation.
    *   User downloads their certificates.

---

## Mixpanel Events Strategy

### Global Properties
These properties should be sent with **every** event where possible:
*   `session_id`: Unique identifier for the user's current session.
*   `role_name`: The professional role the user is pursuing (e.g., "HR Leader").
*   `bundle_id`: The ID of the specific assessment bundle (once created).

### 1. Homepage Events

#### `view_homepage`
*   **Trigger**: When the homepage loads.
*   **Description**: Tracks traffic to the landing page.

#### `search_role_performed`
*   **Trigger**: When a user selects a role from the search dropdown or submits the search input.
*   **Properties**:
    *   `search_query`: The text the user typed.
    *   `selection_method`: 'dropdown_click' or 'enter_key' or 'button_click'.

#### `click_popular_role`
*   **Trigger**: When a user clicks on one of the popular role chips/tags.
*   **Properties**:
    *   `role_name`: The name of the role clicked.

#### `click_generate_assessment`
*   **Trigger**: When the user clicks the main CTA "Generate My Assessment".
*   **Properties**:
    *   `role_name`: The role currently in the search input (if any).

### 2. Role Page Events

#### `view_role_page`
*   **Trigger**: When the Role Page loads.
*   **Properties**:
    *   `role_name`: The role being viewed (from URL).
    *   `is_generated_by_ai`: Boolean, if the content was freshly generated vs loaded.

#### `role_loading_started`
*   **Trigger**: When the personalized role content generation/loading screen appears.
*   **Properties**:
    *   `role_name`: The role being generated.

#### `role_loading_completed`
*   **Trigger**: When the role content is successfully generated and displayed.
*   **Properties**:
    *   `role_name`: The role generated.
    *   `duration_seconds`: Time taken to load/generate.
    *   `status`: How the content was derived (e.g., 'generated', 'matched_by_ai').

#### `click_begin_assessment`
*   **Trigger**: When the user clicks "Begin Assessment Now".
*   **Properties**:
    *   `role_name`: The role context.

### 3. Skill Selection Events

#### `view_select_skills`
*   **Trigger**: When the Skill Selection page loads.

#### `bundle_created`
*   **Trigger**: When the user clicks "Continue" and successfully creates an assessment bundle.
*   **Properties**:
    *   `total_skills_selected`: Count of skills selected (e.g., 3).
    *   `skill_names`: List of names of selected skills.
    *   `bundle_id`: The ID returned by the backend.

### 4. Assessment Events

#### `assessment_loading_started`
*   **Trigger**: When the user lands on `/assessment` and the loading animation begins.

#### `assessment_loading_completed`
*   **Trigger**: When the first scenario is ready and the assessment UI appears.
*   **Properties**:
    *   `duration_seconds`: How long the user waited for generation.

#### `phase_started`
*   **Trigger**: When a new scenario/phase begins.
*   **Properties**:
    *   `phase_number`: 1 to 6.
    *   `phase_name`: Name of the phase (e.g., "Strategy & Engagement").

#### `question_answered`
*   **Trigger**: When a user selects an option for a question.
*   **Properties**:
    *   `phase_number`: Current phase.
    *   `question_id`: ID of the question.
    *   `is_correct`: Boolean (if available on client immediately) or `selected_option`.

#### `phase_completed`
*   **Trigger**: When a user finishes all questions in a phase.
*   **Properties**:
    *   `phase_number`: The phase just finished.

#### `assessment_completed`
*   **Trigger**: When the user finishes the entire assessment (all phases).
*   **Properties**:
    *   `total_phases`: Total number of phases completed.

### 5. Lead Generation Events

#### `view_contact_details`
*   **Trigger**: When the Contact Details form loads.

#### `lead_submission_success`
*   **Trigger**: When the user successfully submits their contact details.
*   **Action**: Call `mixpanel.identify(user_id)` where `user_id` is the unique ID from the backend (or email if ID unavailable).
*   **Action**: Call `mixpanel.people.set({ $email: email, $name: name, $phone: phone })` to create a user profile.
*   **Properties**:
    *   `email_domain`: The domain of the provided email (e.g., 'gmail.com', 'workplace.com').

### 6. Results & Payment Events

#### `view_results_page`
*   **Trigger**: When the Results Page loads.
*   **Properties**:
    *   `score`: The user's assessment score (0-100).
    *   `result_status`: 'Pass' or 'Fail' (assuming 50% cutoff).

#### `results_tab_viewed`
*   **Trigger**: When a user clicks on one of the tabs in the Results Card ('Overview', 'Breakdown', 'Answer Sheet').
*   **Properties**:
    *   `tab_name`: Name of the tab viewed.

#### `report_downloaded`
*   **Trigger**: When a user clicks "Download Report" (PDF).
*   **Properties**:
    *   `score`: The score on the report.
    *   `role_name`: Role associated with the report.

#### `click_checkout_bundle`
*   **Trigger**: When user clicks to purchase the full bundle.
*   **Properties**:
    *   `price`: The displayed price.
    *   `product_name`: Name of the bundle.

#### `click_checkout_individual`
*   **Trigger**: When user clicks to purchase individual certificates.
*   **Properties**:
    *   `price`: The displayed price.
    *   `quantity`: Number of certificates selected.

#### `payment_initiated`
*   **Trigger**: When the Razorpay modal opens.
*   **Properties**:
    *   `order_id`: The internal order ID.
    *   `amount`: Transaction amount.

#### `payment_modal_closed`
*   **Trigger**: When the user closes the Razorpay payment modal without completing the transaction.
*   **Properties**:
    *   `order_id`: The internal order ID.

#### `payment_success`
*   **Trigger**: When Razorpay returns a success response AND backend verification passes.
*   **Properties**:
    *   `payment_id`: Razorpay payment ID.
    *   `order_id`: Internal order ID.
    *   `amount`: Final amount paid.

### 7. Post-Purchase Events

#### `view_payment_success`
*   **Trigger**: When the Success page loads.

#### `certificate_downloaded`
*   **Trigger**: When the user clicks the "Download" button for a certificate.
*   **Properties**:
    *   `certificate_name`: Name of the certificate downloaded.
    *   `unique_certificate_id`: ID of the certificate.
