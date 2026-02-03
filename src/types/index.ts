/**
 * Shared type definitions for the application
 */

export interface UrlParamsData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface StoredUserData {
  email?: string;
  urlParams?: UrlParamsData;
  role?: string;
  sessionId?: string;
  timestamp: number;
  contactDetails?: {
    email?: string;
    phone?: string;
  };
}

export interface PopularRolesData {
  roles: string[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface RoleSearchData {
  roles: string[];
  query: string;
  totalMatches: number;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface LegacyApiResponse<T> {
  result: string;
  message: string;
  data: T;
}

export interface SessionResponse {
  session_id: string;
  role: string;
  utm_params?: UrlParamsData;
  created_at: string; // ISO timestamp string from backend
}

export interface CreateSessionRequest {
  role: string;
  utmParams?: UrlParamsData;
}

// API Response for ready status (200)
export interface RoleContentResponse {
  success: boolean;
  status: 'ready' | 'matched_by_ai' | 'generated' | 'generating';
  message: string;
  data: {
    role: {
      id: number;
      name: string;
      description: string;
      role_core_skill?: string;
      frameworks: string[] | null;
      skills: Array<{
        id: number;
        skill_name: string;
        description: string;
        certificate_preview_url: string;
        skill_certificate_preview_image_link?: string; // ✨ NEW FIELD
        certificate_name?: string;        // ✨ NEW
        certificate_name_short?: string; // ✨ NEW
        skill_frameworks: string[];       // ✨ NEW FIELD - Array of frameworks
        domain: {
          id: number;
          name: string;
          description: string;
        };
      }>;
    };
    // ✨ NEW: Present when status is 'matched_by_ai' or 'generated'
    aiMatching?: {
      originalQuery: string;
      matchedRole: string;
      confidence: number;
      reasoning: string;
    };
  };
}

// API Response for generating status (202)
export interface RoleGeneratingResponse {
  success: boolean;
  status: 'generating';
  message: string;
  data: {
    role_name: string;
    estimated_wait_seconds: number;
  };
}

// Bundle creation types
export interface SelectedSkill {
  id: number;
  skill_name: string;
}

export interface CreateBundleRequest {
  session_id: string;
  role_name: string;
  selected_skills: SelectedSkill[];
}

export interface CreateBundleResponse {
  success: boolean;
  message: string;
  data: {
    bundle_id: number;
    session_id: string;
    role_name: string;
    selected_skills: SelectedSkill[];
    total_scenarios: number;
    scenario_distribution: number[];
    status: "active";
  };
}

// Bundle Scenarios API types
export interface ScenariosResponse {
  success: boolean;
  message: string;
  data: {
    bundle_id: number;
    progress: {
      ready: number;        // Number of scenarios ready
      total: number;        // Total scenarios expected (always 6)
      generating: number;   // Number currently generating
      pending: number;      // Number not started
    };
    role_name?: string;     // ✨ NEW: Role name for dynamic text
    scenarios: Scenario[];
  };
}

export interface ScenarioOption {
  option_id: string; // "A", "B", "C", "D"
  text: string;
  is_correct: boolean;
}

export interface ScenarioQuestion {
  question_id: number;
  question_text: string;
  options: ScenarioOption[];
}

export interface ScenarioReferenceMaterials {
  key_concepts: string[];
  visual_model: {
    name: string;
    description: string;
    svg?: string;
  };
}

export interface Scenario {
  scenario_id: number;
  skill_name: string;
  difficulty: string;
  phase: string;
  phase_description: string;
  scenario_name: string;
  project_mandate: {
    business_problem: string;
    high_level_goal: string;
    initial_budget: string;
  };
  reference_materials: ScenarioReferenceMaterials;
  questions: ScenarioQuestion[];
  status?: 'ready' | 'generating' | 'pending'; // Keeping status for compatibility if needed, though mostly static now
}

// Deprecated or mapped types if needed for other parts of the app
// For now, I'm defining Scenario to match the new JSON directly.


// Progress Update API types
export interface UserAnswer {
  question_id: number;               // ID from quiz question
  selected_option: string;           // User's choice ('a', 'b', 'c', 'd')
}

// New Xano API format for quiz progress
export interface PhaseUserAnswer {
  question_id: number;
  selected_option: string;
}

export interface AttemptObject {
  phase_number: number;
  phase_name: string;
  scenario_id: number;
  phase_user_answers: PhaseUserAnswer[];
  time_taken_in_seconds?: number;
}

export interface ProgressUpdateRequest {
  attempt_object: AttemptObject;
  session_id: number;
  time_taken_in_seconds?: number; // Total assessment time
}

export interface ProgressUpdateResponse {
  result: 'success' | 'error';
  message: string;
  data: {
    specialized_sessions_id: number;
    quiz_attempt_data: AttemptObject[];
  };
}

// Assessment Report API types
export interface ScoreBreakdownItem {
  phase_name: string;
  phase_score: number;
  phase_number: number;
  phase_correct_answers: number;
  phase_total_questions: number;
  skill_name?: string;
}

export interface AnswerSheetItem {
  question: string;
  rationale: string;
  is_correct: boolean;
  users_answer: string;
  correct_answer: string;
}

export interface AssessmentReportData { // Inner data object
  id: number;
  created_at: number;
  specialized_sessions_id: number;
  specialized_session_user_bundle_id: number;
  specialized_session_quiz_data_id: number;
  assessment_score: string;
  score_breakdown: ScoreBreakdownItem[];
  ai_summary: string;
  answer_sheet: AnswerSheetItem[];
  strengths?: {
    category: string;
    description: string;
    evidence: string;
  }[];
  weaknesses?: {
    category: string;
    description: string;
    recommendation: string;
  }[];
  time_taken_in_seconds?: number;
  ai_skill_breakdown?: {
      proficiency_name: string;
      score: number;
  }[];
}

export interface AssessmentReportResponse {
  result: 'success' | 'error';
  message: string;
  data: AssessmentReportData;
}

export interface AssessmentReportRequest {
  session_id: number;
}

// ✨ NEW: Bundle Product Types
export interface DeliverableItem {
  id: number;
  created_at: number;
  skill_name: string;
  certification_name: string;
  certification_name_short: string; // e.g. "PMPx"
  unique_certificate_id: string; // e.g. "CERT-101-5551212"
  recipient_name?: string; // ✨ NEW: Allow passing name overrides
}
export interface CertificationItem {
  skill_id: number;
  certification_name: string;
  certification_name_short: string;
  skill_description: string;
  certificate_preview_url?: string;
  frameworks?: string[];
  price?: number;        // ✨ NEW
  original_price?: number; // ✨ NEW
  badge?: string;
}

export interface BundleProductData {
  bundle_name: string;
  certifications: CertificationItem[];
  product_cost: number;
}

export interface BundleProductResponse {
  result: 'success' | 'failed';
  message: string;
  data: BundleProductData;
}

// ✨ NEW: User Check Types
export interface CertifiedUserData {
  id?: number | string; // Adding ID for session linking
  name: string;
  email: string;
  phone_number: string;
}

export interface CertifiedUserResponse {
  result: 'success' | 'failed';
  message: string;
  error_code?: string;
  data: CertifiedUserData | null;
}

// ✨ NEW: Razorpay Order Types
export interface CreateOrderParams {
  session_id: number;
  bundle_id: number;
  purchase_type: 'bundle' | 'individual';
  skill_ids: number[];
}

export interface PurchasedProduct {
  item_type: 'bundle' | 'individual';
  item_name: string;
  item_id: number;
}

export interface CreateOrderData {
  id: number;
  created_at: number;
  razorpay_order_id: string;
  specialized_sessions_id: number;
  specialized_session_user_bundle_id: number;
  specialized_users_id: number;
  is_paid: boolean;
  payment_status: string;
  razorpay_payment_id: string;
  purchased_products: PurchasedProduct[];
}

export interface CreateOrderResponse {
  result: 'success' | 'error';
  message: string;
  data: CreateOrderData;
}

// ✨ NEW: Certificate Persistent Types
export interface CertificateRecord {
  id: string; // UUID
  unique_certificate_id: string;
  session_id: string; // UUID
  recipient_name: string;
  certificate_name: string;
  issue_date: string; // ISO String
  image_url?: string;
  status: 'pending' | 'generated';
  metadata?: any;
  created_at: string;
}