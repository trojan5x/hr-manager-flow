/**
 * API service functions for backend communication - STATIC VERSION
 */

import type { 
  RoleContentResponse, 
  RoleGeneratingResponse, 
  SessionResponse, 
  UrlParamsData, 
  CreateBundleResponse, 
  ScenariosResponse, 
  ProgressUpdateRequest, 
  ProgressUpdateResponse, 
  AssessmentReportResponse,
  BundleProductResponse,
  CreateOrderParams,
  CreateOrderResponse,
  CertifiedUserData,
  CertificateRecord,
  RoleData,
  DeliverableItem,
  UserLookupData,
  UserLookupResponse,
  PackDeliverables,
  CertificationItem,
  DateFilter
} from '../types';
export type { CertificationItem, BundleProductData, UserLookupData, UserLookupResponse, DateFilter } from '../types';
import { HR_MANAGER_ROLE, MOCK_ASSESSMENT, MOCK_BUNDLE_PRODUCTS } from '../data/staticData';
// =============================================================================
// =============================================================================

/**
 * Fetch Role Details for Landing Page - REAL API
 */
export const getRoleDetails = async (roleName: string): Promise<RoleData | null> => {
  console.log(`API: Fetching role details for ${roleName}`);
  
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('id, role_name, description, core_skill, frameworks, role_landing_pages(content)')
      .eq('role_name', roleName)
      .eq('status', 'published')
      .single();

    if (error) {
      console.warn(`Error fetching details for role ${roleName}:`, error);
      return null;
    }

    let scorecard_stats = undefined;
    if (data.role_landing_pages && Array.isArray(data.role_landing_pages) && data.role_landing_pages.length > 0) {
        const content = data.role_landing_pages[0].content;
        if (content && content.scorecard_stats) {
            scorecard_stats = content.scorecard_stats;
        }
    } else if (data.role_landing_pages && !Array.isArray(data.role_landing_pages)) {
        const content = (data.role_landing_pages as any).content;
        if (content && content.scorecard_stats) {
            scorecard_stats = content.scorecard_stats;
        }
    }

    return {
      id: data.id,
      role_name: data.role_name,
      description: data.description,
      core_skill: data.core_skill,
      frameworks: data.frameworks,
      scorecard_stats
    } as RoleData;
  } catch (error) {
    console.error('Exception fetching role details:', error);
    return null;
  }
};

// STATIC API IMPLEMENTATION
// =============================================================================

/**
 * Fetch popular roles - MOCK
 */
export const fetchPopularRoles = async (limit: number = 20, offset: number = 0): Promise<string[]> => {
  console.log('STATIC: Fetching popular roles');
  return ['HR Manager', 'Talent Acquisition', 'HR Specialist', 'Chief Human Resources Officer'].slice(offset, offset + limit);
};

/**
 * Check if user is certified/exists - REAL API
 */
export const checkCertifiedUser = async (email: string): Promise<CertifiedUserData | null> => {
  console.log(`Checking user existence for: ${email}`);
  
  try {
    const response = await fetch(`https://xgfy-czuw-092q.m2.xano.io/api:_s7o0tIE/user/certified_check?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`User check API failed: ${response.status}`);
      return null;
    }

    const result = await response.json();
    console.log('User check response:', result);

    if (result.result === 'success' && result.data) {
      return result.data as CertifiedUserData;
    }

    return null;
  } catch (error) {
    console.error('Error checking user certification:', error);
    return null;
  }
};

/**
 * Signup user - REAL API (Supabase)
 */
export const signupUser = async (signupData: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
}): Promise<any> => {
    console.log('API: Signing up user', signupData);
    
    try {
        const { data, error } = await supabase
            .from('users')
            .upsert({
                name: signupData.name,
                email: signupData.email,
                phone_number: signupData.phone,
                last_login_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { 
                onConflict: 'email' 
            })
            .select()
            .single();

        if (error) {
            console.error('Signup error:', error);
            throw error;
        }

        return {
            result: 'success',
            message: 'User signed up',
            data: data
        };
    } catch (error) {
        console.error('Error in signupUser:', error);
        throw error;
    }
};

/**
 * Search for roles - REAL API (Supabase)
 */
export const searchRoles = async (query: string, limit: number = 10): Promise<string[]> => {
  console.log(`API: Searching roles for "${query}"`);
  try {
    let supabaseQuery = supabase
      .from('roles')
      .select('role_name')
      .eq('status', 'published')
      .limit(limit);

    if (query) {
      supabaseQuery = supabaseQuery.ilike('role_name', `%${query}%`);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
        console.warn('Role search Supabase query failed', error);
        return [];
    }

    // Handle when returning an empty array.
    if (!data) return [];
    
    // Map them to just the role names strings.
    return data.map((item: any) => item.role_name);
  } catch (error) {
    console.error('Error searching roles:', error);
    return [];
  }
};

import { supabase } from './supabaseClient';

/**
 * Create a new user session - REAL API
 */
export const createSession = async (
  role: string,
  utmParams?: UrlParamsData,
  retries: number = 3
): Promise<SessionResponse> => {
  console.log('API: Creating session via Supabase', { role, utmParams });
  
  let attempt = 0;
  
  while (attempt < retries) {
      try {
          // Map UTM params to individual columns if they exist
          const sessionData: any = {
              role: role,
              user_agent: navigator.userAgent,
          };

          if (utmParams?.utm_source) sessionData.utm_source = utmParams.utm_source;
          if (utmParams?.utm_medium) sessionData.utm_medium = utmParams.utm_medium;
          if (utmParams?.utm_campaign) sessionData.utm_campaign = utmParams.utm_campaign;
          if (utmParams?.utm_content) sessionData.utm_content = utmParams.utm_content;
          if (utmParams?.utm_term) sessionData.utm_term = utmParams.utm_term;

          const { data, error } = await supabase
              .from('sessions')
              .insert([sessionData])
              .select('id, created_at')
              .single();

          if (error || !data) {
              console.warn(`Supabase session creation error (Attempt ${attempt + 1}):`, error);
              throw new Error(`DB error! ${error?.message || 'Unknown error'}`);
          }

          // Sessions table uses bigint auto-increment IDs, convert to string
          const sessionId = data.id.toString();
          
          if (import.meta.env.DEV) {
              console.log('[API] ✅ Session created successfully:', {
                  sessionId: sessionId,
                  type: 'bigint',
                  created_at: data.created_at
              });
          }

          return {
            session_id: sessionId,
            role: role,
            created_at: data.created_at
          };
          
      } catch (error) {
          attempt++;
          console.error(`Failed to create session via DB (Attempt ${attempt}/${retries})`, error);
          
          if (attempt >= retries) {
               console.error('Critical: All session creation attempts failed.');
               throw new Error('Failed to initialize session. Please check your connection and refresh.');
          }
          // Wait before retry (exponential backoff: 500ms, 1000ms, 2000ms)
          await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
      }
  }
  
  throw new Error('Session creation failed');
};

/**
 * Update session with User ID - REAL (Supabase)
 */
export const updateSessionUser = async (
    sessionId: string | number,
    userId: number | string
): Promise<boolean> => {
    console.log(`API: Linking Session ${sessionId} to User ${userId}`);
    try {
        const { error } = await supabase
            .from('sessions')
            .update({ user_id: userId })
            .eq('id', sessionId);

        if (error) {
            console.error('Failed to link user to session:', error);
            return false;
        }
        return true;
    } catch (e) {
        console.error('Error in updateSessionUser:', e);
        return false;
    }
};

/**
 * Fetch Session Details - REAL (Supabase)
 */
export const getSessionDetails = async (sessionId: string | number): Promise<{ role: string } | null> => {
    console.log(`API: Fetching details for Session ${sessionId}`);
    try {
        const { data, error } = await supabase
            .from('sessions')
            .select('role')
            .eq('id', sessionId)
            .single();

        if (error || !data) {
            console.error('Failed to fetch session details:', error);
            return null;
        }
        return data;
    } catch (e) {
        console.error('Error in getSessionDetails:', e);
        return null;
    }
};

/**
 * Get dynamic community size for a role - REAL (Supabase)
 */
export const getRoleCommunitySize = async (roleName: string): Promise<number> => {
    console.log(`API: Fetching community size for ${roleName}`);
    try {
        const { count, error } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .eq('role', roleName);

        if (error) {
            console.error('Failed to fetch role community count:', error);
            return 2847; // Fallback to hardcoded default
        }

        // Return a base offset + real session count
        // Using a high base number to make the community look established
        const baseOffset = 2840;
        return baseOffset + (count || 0);
    } catch (e) {
        console.error('Error in getRoleCommunitySize:', e);
        return 2847;
    }
};

/**
 * Get role-specific content - MOCK
 */
export const getRoleContent = async (role: string): Promise<RoleContentResponse | RoleGeneratingResponse> => {
  console.log(`STATIC: Getting content for role: ${role}`);
  // Always return the HR Manager role data
  return { ...HR_MANAGER_ROLE };
};

/**
 * Create assessment bundle - MOCK
 */
export const createBundle = async (bundleData: any): Promise<CreateBundleResponse> => {
  console.log('STATIC: Creating bundle', bundleData);
  return {
    success: true,
    message: 'Bundle created',
    data: {
      bundle_id: 12345,
      session_id: bundleData.session_id,
      role_name: 'HR Manager',
      selected_skills: bundleData.selected_skills,
      total_scenarios: 6,
      scenario_distribution: [1, 1, 1, 1, 1, 1],
      status: 'active'
    }
  };
};

/**
 * Generate content using AI - MOCK
 */
export const generateContent = async (_prompt: string): Promise<string> => {
  console.log('STATIC: generateContent called (mocked)');
  return "{}";
};

/**
 * Fetch bundle with scenarios - REAL API (Supabase)
 */
export const fetchBundleScenarios = async (
  sessionId: string | number,
  _waitForUpdates: boolean = false,
  _timeoutSeconds: number = 30
): Promise<ScenariosResponse> => {
  console.log(`API: Fetching scenarios for session ${sessionId}`);

  try {
    // 1. Fetch Session to get the Role
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('role')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error('Error fetching session:', sessionError);
      return { success: false, message: 'Session not found', data: null as any };
    }

    const sessionRoleName = sessionData.role;

    // 2. Fetch the Role ID
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id, role_name')
      .eq('role_name', sessionRoleName)
      .single();

    if (roleError || !roleData) {
      console.error('Error fetching role:', roleError);
      return { success: false, message: 'Role not found', data: null as any };
    }

    // 3. Fetch the Assessment for this Role
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('assessments')
      .select('id')
      .eq('role_id', roleData.id)
      .eq('status', 'published')
      .single();

    if (assessmentError || !assessmentData) {
      console.error('Error fetching assessment:', assessmentError);
      return { success: false, message: 'Assessment not found', data: null as any };
    }

    // 4. Fetch the Assessment Phases, Scenarios, and Questions
    // Using a joined query to get the whole tree
    const { data: phasesData, error: phasesError } = await supabase
      .from('assessment_phases')
      .select(`
        order_index,
        phase_name:name,
        phase_description:description,
        scenarios!inner (
          id,
          name,
          principle,
          context,
          challenge,
          task,
          key_concepts,
          visual_model,
          difficulty,
          skill_name,
          project_mandate,
          questions (
            id,
            question_text,
            options
          )
        )
      `)
      .eq('assessment_id', assessmentData.id)
      .order('order_index', { ascending: true });

    if (phasesError || !phasesData) {
       console.error('Error fetching phases and scenarios:', phasesError);
       return { success: false, message: 'Failed to fetch scenarios', data: null as any };
    }

    // 5. Map the database results into the expected ScenariosResponse format
    const scenarios = phasesData.map((phase: any) => {
      const dbScenario = phase.scenarios;
      
      return {
        scenario_id: phase.order_index,
        db_scenario_id: dbScenario.id, // Keep the real ID just in case
        skill_name: dbScenario.skill_name || 'General Skill',
        difficulty: dbScenario.difficulty || 'medium',
        phase: phase.phase_name,
        phase_description: phase.phase_description,
        scenario_name: dbScenario.name,
        // Add the direct fields that the frontend expects
        context: dbScenario.context,
        challenge: dbScenario.challenge,
        task: dbScenario.task,
        project_mandate: dbScenario.project_mandate || {
            business_problem: dbScenario.context,
            high_level_goal: dbScenario.task,
            initial_budget: "N/A"
        },
        reference_materials: {
          key_concepts: dbScenario.key_concepts || [],
          visual_model: dbScenario.visual_model || { name: "Model", description: "Standard Model" }
        },
        questions: (dbScenario.questions || []).map((q: any) => ({
          question_id: q.id,
          question_text: q.question_text,
          options: (q.options || []).map((opt: any) => ({
             option_id: opt.option_id,
             text: opt.text || opt.option_text,
             is_correct: opt.is_correct
          }))
        }))
      };
    });

    return {
      success: true,
      message: 'Scenarios loaded successfully',
      data: {
        bundle_id: assessmentData.id,
        role_name: roleData.role_name,
        progress: {
          ready: scenarios.length,
          total: scenarios.length,
          generating: 0,
          pending: 0
        },
        scenarios: scenarios
      }
    };

  } catch (error) {
    console.error('Exception fetching scenarios:', error);
    return { success: false, message: 'Exception occurred', data: null as any };
  }
};

/**
 * Update assessment progress - MOCK
 */
export const updateProgress = async (
  progressData: ProgressUpdateRequest
): Promise<ProgressUpdateResponse> => {
  console.log('STATIC: Updating progress', progressData);
  return {
    result: 'success',
    message: 'Progress updated',
    data: {
        specialized_sessions_id: 1,
        quiz_attempt_data: [progressData.attempt_object]
    }
  };
};

export const updateProgressWithRetry = async (
  progressData: ProgressUpdateRequest,
  _retries: number = 3
): Promise<ProgressUpdateResponse> => {
  return updateProgress(progressData);
};

/**
 * Fetch assessment report - LOGIC
 * Calculates score from LocalStorage answers against Static Data
 */
export const fetchAssessmentReport = async (
  sessionId: number,
  _retries: number = 5,
  _delayMs: number = 6000
): Promise<AssessmentReportResponse> => {
  console.log(`[DEBUG_SCORE] Generating report for Session: ${sessionId}`);

  // 1. Load Answers into Map<ScenarioID, Map<QuestionID, Answer>>
  // Key = ScenarioID (normalized to number)
  // Value = Map<QuestionID (number), AnswerObject>
  const answersMap = new Map<number, Map<number, any>>();
  let cumulativeTime = 0;
  let useFallback = false;

  try {
      const allStorageKeys = Object.keys(localStorage);
      
      // Strict regex matching for phase data
      const phaseDataKeys = allStorageKeys.filter(k => k.match(/assessment_.*_phase_\d+_data/));
      
      console.log(`[DEBUG_SCORE] Found ${phaseDataKeys.length} phase data keys:`, phaseDataKeys);

      if (phaseDataKeys.length > 0) {
          phaseDataKeys.forEach(key => {
              try {
                  const rawContent = localStorage.getItem(key);
                  if (!rawContent) return;
                  
                  const data = JSON.parse(rawContent);
                  
                  // Normalize Scenario ID: Prefer scenario_id, fallback to phase_number
                  // Ensure it is a valid integer
                  let scenarioId = parseInt(data.scenario_id, 10);
                  if (isNaN(scenarioId)) {
                      scenarioId = parseInt(data.phase_number, 10);
                  }

                  // If still valid
                  if (!isNaN(scenarioId)) {
                        console.log(`[DEBUG_SCORE] Reading Key: ${key} -> ScenarioID: ${scenarioId} | Answers: ${data.phase_user_answers?.length || 0}`);

                        if (data.phase_user_answers && Array.isArray(data.phase_user_answers)) {
                            // Create or get existing map for this scenario
                            const currentScenarioMap = answersMap.get(scenarioId) || new Map<number, any>();
                            
                            data.phase_user_answers.forEach((ans: any) => {
                                // Normalize Question ID to number
                                const qId = parseInt(ans.question_id, 10);
                                if (!isNaN(qId)) {
                                    currentScenarioMap.set(qId, ans);
                                }
                            });
                            
                            answersMap.set(scenarioId, currentScenarioMap);
                        }

                        if (data.time_taken_in_seconds) {
                            const phaseTime = Number(data.time_taken_in_seconds) || 0;
                            cumulativeTime += phaseTime;
                            console.log(`[DEBUG_TIME] Phase ${scenarioId} time: ${phaseTime}s, cumulative: ${cumulativeTime}s`);
                        } else {
                            console.log(`[DEBUG_TIME] Phase ${scenarioId} has no time_taken_in_seconds field`);
                        }
                  } else {
                      console.warn(`[DEBUG_SCORE] Skipped key ${key}: Invalid Scenario/Phase ID`);
                  }

              } catch (err) {
                  console.error(`[DEBUG_SCORE] Error parsing key ${key}:`, err);
              }
          });
      } else {
          console.warn('[DEBUG_SCORE] No phase data keys found. Flagging for fallback.');
          useFallback = true;
      }

      // Legacy Fallback
      if (answersMap.size === 0) {
          // Check for flattened answers
          const backupKey = allStorageKeys.find(k => k.includes('_answers') && k.startsWith('assessment_'));
          if (backupKey) {
             console.log(`[DEBUG_SCORE] Attempting legacy backup from: ${backupKey}`);
             // If we find legacy backup, we can't reliably map to scenarios without guessing.
             // We will handle this in the scoring loop via 'useFallback' flag.
          }
      }
      
      // Time Fallback
      if (cumulativeTime === 0) {
           console.log('[DEBUG_TIME] No time found in phase data, checking progress backup...');
           const progKey = allStorageKeys.find(k => k.includes('_progress') && k.startsWith('assessment_'));
           if (progKey) {
              const pData = JSON.parse(localStorage.getItem(progKey) || '{}');
              const fallbackTime = pData.cumulativeTime !== undefined ? pData.cumulativeTime : 300;
              console.log(`[DEBUG_TIME] Progress backup time: ${pData.cumulativeTime}, using: ${fallbackTime}s`);
              cumulativeTime = fallbackTime;
           } else {
              console.log('[DEBUG_TIME] No progress backup found, will use default');
           }
      } else {
          console.log(`[DEBUG_TIME] Total time from phase data: ${cumulativeTime}s`);
      }

  } catch (e) {
      console.error('[DEBUG_SCORE] Critical error in data aggregation:', e);
  }

  // 2. Calculate Score
  let correctCount = 0;
  let totalQuestions = 0;
  
  const answerSheet: any[] = [];
  const scoreBreakdown: any[] = [];

  // Iterate over STATIC Scenarios (Source of Truth)
  MOCK_ASSESSMENT.data.scenarios.forEach((scenario, index) => {
      let phaseCorrect = 0;
      let phaseTotal = scenario.questions?.length || 0;
      
      // Normalized Scenario ID from Static Data
      const staticScenarioId = Number(scenario.scenario_id);
      
      // Lookup answers for this scenario
      // Try exact ID match first
      let scenarioAnswers = answersMap.get(staticScenarioId);
      
      // If not found, and we only have 1 item in map, maybe ids mismatch? 
      // (Optional heuristic avoided for safety)
      
      console.log(`[DEBUG_SCORE] Scoring Scenario ${staticScenarioId} ("${scenario.scenario_name}") - Answers Available: ${!!scenarioAnswers}`);

      scenario.questions?.forEach((q: any) => {
          totalQuestions++;
          const qId = Number(q.question_id);
          let userAnswer: any = undefined;

          // Strategy 1: Precise Match (Scenario ID + Question ID)
          if (scenarioAnswers) {
              userAnswer = scenarioAnswers.get(qId);
          } 
          
          // Strategy 2: Legacy/Backup (Flattened List)
          // Only attempt if we have absolutely no map data and fallback was flagged
          if (!userAnswer && useFallback && answersMap.size === 0) {
               const keys = Object.keys(localStorage);
               const backupKey = keys.find(k => k.includes('_answers') && k.startsWith('assessment_'));
               if (backupKey) {
                   const raw = JSON.parse(localStorage.getItem(backupKey) || '{}');
                   const list = Array.isArray(raw) ? raw : (raw.answers || []);
                   // Loose match on Question ID only (Dangerous but necessary for legacy)
                   userAnswer = list.find((a: any) => Number(a.question_id) === qId);
               }
          }

          // Scoring Logic
          const correctOptionRef = q.options?.find((o: any) => o.is_correct);
          const correctOptionId = correctOptionRef?.option_id;

          // Normalize for comparison
          // 1. Convert to string
          // 2. Trim whitespace
          // 3. Lowercase
          const rawSelected = userAnswer?.selected_option;
          const userVal = rawSelected ? String(rawSelected).trim().toLowerCase() : null;
          
          const rawCorrect = correctOptionId;
          const correctVal = rawCorrect ? String(rawCorrect).trim().toLowerCase() : null;

          const isCorrect = (userVal !== null) && (correctVal !== null) && (userVal === correctVal);

          if (isCorrect) {
              phaseCorrect++;
          }
          
          // Verbose log for first few checks or failures
          console.log(`   [Q${qId}] User: "${rawSelected}" (${userVal}) | Correct: "${rawCorrect}" (${correctVal}) | Matches? ${isCorrect}`);

          answerSheet.push({
              question: q.question_text,
              rationale: "", 
              is_correct: isCorrect,
              users_answer: rawSelected || '-',
              correct_answer: correctOptionId
          });
      });
      
      correctCount += phaseCorrect;
      
      scoreBreakdown.push({
          phase_name: scenario.scenario_name,
          phase_score: phaseTotal > 0 ? Math.round((phaseCorrect / phaseTotal) * 100) : 0,
          phase_number: index + 1,
          phase_correct_answers: phaseCorrect,
          phase_total_questions: phaseTotal,
          skill_name: scenario.skill_name || scenario.scenario_name
      });
  });

  // FINAL SCORE: Return the RAW COUNT of correct answers.
  // The UI (ResultsPageV3) calculates percentage as: (raw_score / total_questions) * 100
  const finalScoreVariable = correctCount;
  
  console.log(`[DEBUG_SCORE] Final Validated Score (Count): ${finalScoreVariable} / ${totalQuestions}`);

  const finalTime = cumulativeTime > 0 ? cumulativeTime : 300;
  console.log(`[DEBUG_TIME] Final report time: ${finalTime}s (from cumulative: ${cumulativeTime}s)`);
  
  return {
    result: 'success',
    message: 'Report generated successfully',
    data: {
      id: 999,
      created_at: Date.now(),
      specialized_sessions_id: sessionId,
      specialized_session_user_bundle_id: 12345,
      specialized_session_quiz_data_id: 888,
      assessment_score: finalScoreVariable.toString(), // Passing count as string
      score_breakdown: scoreBreakdown,
      ai_summary: "",
      answer_sheet: answerSheet,
      strengths: [
          { category: "Management", description: "Strategic Thinking", evidence: "Consistent performance in planning scenarios." }
      ],
      weaknesses: [
          { category: "Tactical", description: "Execution Details", recommendation: "Review detailed process steps." }
      ],
      time_taken_in_seconds: finalTime
    }
  };
};

/**
 * Fetch bundle product details - MOCK
 */
export const fetchBundleProducts = async (bundleId: number): Promise<BundleProductResponse> => {
  console.log(`STATIC: Fetching products for bundle ${bundleId}`);
  return MOCK_BUNDLE_PRODUCTS;
};

/**
 * Create Razorpay order - MOCK
 */
export const createRazorpayOrder = async (params: CreateOrderParams): Promise<CreateOrderResponse> => {
  console.log('STATIC: Creating Razorpay order', params);
  return {
    result: 'success',
    message: 'Order created',
    data: {
      id: 777,
      created_at: Date.now(),
      razorpay_order_id: 'order_STATIC_' + Date.now(),
      specialized_sessions_id: params.session_id,
      specialized_session_user_bundle_id: params.bundle_id,
      specialized_users_id: 123,
      is_paid: false,
      payment_status: 'created',
      razorpay_payment_id: '',
      purchased_products: []
    }
  };
};

// Supabase configuration for edge functions
const SUPABASE_URL = 'https://api-supabase.learntube.ai';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuZHF2dHVlanV4YW5oenZ1d29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjIzODgsImV4cCI6MjA4NTMzODM4OH0.7_ZiCYTQzhSgspHcs25cS5t5iK0jV1CjrM0bAg3_-Wk';

/**
 * Create Payment Order via Supabase Edge Function
 */
export const createPaymentOrder = async (
    amount: number, 
    purchasedProducts: string, 
    projectName: string = 'specialized_platform_main', 
    additionalNotes: any = {},
    detailedItems: any[] = [] // NEW: Add detailed items parameter
) => {
  try {
    const requestBody = {
      amount: amount * 100, // Convert to paise (multiply by 100)
      currency: 'INR',
      notes: {
        project_name: projectName,
        purchased_products: purchasedProducts,
        detailed_items: JSON.stringify(detailedItems), // NEW: Pass detailed items as JSON string
        ...additionalNotes // Spread the additional notes (user details, etc.)
      }
    };

    console.log('Creating order via Supabase edge function:', requestBody);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-razorpay-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase edge function error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    console.log('Supabase edge function response:', result);
    
    // The Supabase edge function returns the Razorpay order object directly
    return result; 
  } catch (error) {
    console.error('Error creating payment order via Supabase:', error);
    throw error;
  }
};

/**
 * Create Pack Payment Order via Supabase Edge Function
 */
export const createPackPaymentOrder = async (
    amount: number,
    packName: string,
    deliverables: PackDeliverables,
    detailedItems: CertificationItem[],
    additionalNotes: any = {}
) => {
  try {
    const requestBody = {
      amount: amount * 100, // Convert to paise (multiply by 100)
      currency: 'INR',
      notes: {
        project_name: 'specialized_platform_main',
        purchased_products: packName,
        pack_deliverables: JSON.stringify(deliverables), // NEW: Complete promise to user
        detailed_items: JSON.stringify(detailedItems),
        purchase_type: 'PACK',
        ...additionalNotes // Spread the additional notes (user details, etc.)
      }
    };

    console.log('Creating pack order via Supabase edge function:', requestBody);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-razorpay-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase edge function error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    console.log('Supabase edge function response:', result);
    
    // The Supabase edge function returns the Razorpay order object directly
    return result; 
  } catch (error) {
    console.error('Error creating pack payment order via Supabase:', error);
    throw error;
  }
};

/**
 * Check Payment Status - MOCK
 */
export const checkPaymentStatus = async (orderId: number) => {
    console.log(`STATIC: Checking payment status for ${orderId}`);
    return {
        result: 'success',
        data: { status: 'paid' }
    };
};

// ✨ NEW: Certificate Persistence Helper Functions

/**
 * createCertificateRecord - Inserts initial record
 */
export const createCertificateRecord = async (
    sessionId: string,
    _recipientName: string,
    _certName: string,
    uniqueId: string,
    metadata: any = {} // ✨ NEW: Accept metadata
): Promise<CertificateRecord | null> => {
    console.log(`API: Creating certificate record for ${uniqueId}`);
    
    try {
        const { data, error } = await supabase
            .from('user_certificates')
            .insert({
                session_id: sessionId,
                user_id: metadata.user_id || null,
                role_id: metadata.role_id || null,
                role_certificate_id: metadata.role_certificate_id || null,
                certificate_id: uniqueId,
                status: 'pending',
                metadata: metadata
            })
            .select()
            .single();

        if (error) {
            // Ignore unique constraint error if it already exists (idempotency)
            if (error.code === '23505') {
                 console.log('Certificate record already exists, skipping creation');
                 return null; 
            }
            console.error('Error creating certificate record:', error);
            return null;
        }
        return data as CertificateRecord;
    } catch (e) {
        console.error('Exception creating certificate record:', e);
        return null;
    }
};

/**
 * updateCertificateUrl - Updates URL after generation
 */
export const updateCertificateUrl = async (uniqueId: string, url: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('user_certificates')
            .update({
                certificate_image_url: url,
                status: 'generated'
            })
            .eq('certificate_id', uniqueId);

        if (error) {
            console.error('Error updating certificate URL:', error);
            return false;
        }
        return true;
    } catch (e) {
        console.error('Exception updating certificate URL:', e);
        return false;
    }
};

/**
 * getCertificatesBySession - Fetch all for visualization
 */
export const getCertificatesBySession = async (sessionId: string): Promise<CertificateRecord[]> => {
    try {
        const { data, error } = await supabase
            .from('user_certificates')
            .select('*')
            .eq('session_id', sessionId);

        if (error) {
            console.error('Error fetching certificates:', error);
            return [];
        }
        return data as CertificateRecord[];
    } catch (e) {
        console.error('Exception fetching certificates:', e);
        return [];
    }
};

/**
 * getAllCertificates - For Admin Dashboard
 */
export const getAllCertificates = async (): Promise<CertificateRecord[]> => {
    try {
        const { data, error } = await supabase
            .from('certificates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all certificates:', error);
            return [];
        }
        return data as CertificateRecord[];
    } catch (e) {
        console.error('Exception fetching all certificates:', e);
        return [];
    }
};

/**
 * Payment Analytics Types
 */
export interface PaymentAnalytics {
    totalRevenue: number;
    averageOrderValue: number;
    totalOrders: number;
    successfulPayments: number;
    totalAssessments?: number;
    totalCertificates?: number;
    conversionRate?: number;
}

/**
 * Get Payment Analytics - For Admin Dashboard
 * Fetches all successful payments and calculates metrics with optional date filtering
 */
export const getPaymentAnalytics = async (dateFilter?: DateFilter): Promise<PaymentAnalytics> => {
    console.log('🔍 API DEBUG: getPaymentAnalytics called with dateFilter:', dateFilter);
    console.log('🔍 API DEBUG: dateFilter stringified:', JSON.stringify(dateFilter));
    
    try {
        // Base query for orders with payments
        let ordersQuery = supabase
            .from('orders')
            .select('amount, created_at, status')
            .eq('status', 'paid');

        // Apply date filters if provided
        if (dateFilter?.startDate) {
            console.log('🔍 API DEBUG: Applying startDate filter:', dateFilter.startDate);
            ordersQuery = ordersQuery.gte('created_at', dateFilter.startDate);
        }
        if (dateFilter?.endDate) {
            console.log('🔍 API DEBUG: Applying endDate filter:', dateFilter.endDate);
            ordersQuery = ordersQuery.lte('created_at', dateFilter.endDate);
        }

        const { data: orders, error: ordersError } = await ordersQuery;
        console.log('🔍 API DEBUG: Query result - orders count:', orders?.length);

        if (ordersError) {
            console.error('Error fetching payment analytics:', ordersError);
            return {
                totalRevenue: 0,
                averageOrderValue: 0,
                totalOrders: 0,
                successfulPayments: 0
            };
        }

        // Base query for assessments
        let assessmentsQuery = supabase
            .from('user_assessments')
            .select('created_at, is_complete');

        if (dateFilter?.startDate) {
            assessmentsQuery = assessmentsQuery.gte('created_at', dateFilter.startDate);
        }
        if (dateFilter?.endDate) {
            assessmentsQuery = assessmentsQuery.lte('created_at', dateFilter.endDate);
        }

        const { data: assessments } = await assessmentsQuery;

        // Base query for certificates
        let certificatesQuery = supabase
            .from('user_certificates')
            .select('created_at, status');

        if (dateFilter?.startDate) {
            certificatesQuery = certificatesQuery.gte('created_at', dateFilter.startDate);
        }
        if (dateFilter?.endDate) {
            certificatesQuery = certificatesQuery.lte('created_at', dateFilter.endDate);
        }

        const { data: certificates } = await certificatesQuery;

        // Calculate metrics
        const successfulPayments = orders?.length || 0;
        const totalRevenue = orders?.reduce((sum, order) => sum + (Number(order.amount) || 0), 0) || 0;
        const averageOrderValue = successfulPayments > 0 ? totalRevenue / successfulPayments : 0;
        const totalAssessments = assessments?.length || 0;
        const totalCertificates = certificates?.length || 0;
        const conversionRate = totalAssessments > 0 ? (successfulPayments / totalAssessments) * 100 : 0;

        return {
            totalRevenue,
            averageOrderValue: Math.round(averageOrderValue * 100) / 100,
            totalOrders: successfulPayments,
            successfulPayments,
            totalAssessments,
            totalCertificates,
            conversionRate: Math.round(conversionRate * 100) / 100
        };
    } catch (e) {
        console.error('Exception fetching payment analytics:', e);
        return {
            totalRevenue: 0,
            averageOrderValue: 0,
            totalOrders: 0,
            successfulPayments: 0
        };
    }
};

// ✨ NEW: Digital Deliverables Types


export interface DeliverablesResponse {
  result: 'success' | 'error';
  message: string;
  data: DeliverableItem[];
}

export interface CertificateDownloadResponse {
  result: 'success' | 'error';
  message: string;
  data: {
    certificate_image_link: string;
  };
}

/**
 * Fetch digital deliverables (Certificates) - MOCK
 */
/**
 * Fetch digital deliverables (Certificates) - WITH PERSISTENCE
 * Now checks Supabase first. If missing, creates "pending" records.
 */
export const fetchDeliverables = async (
    orderId: string, 
    sessionId?: string, // ✨ NEW: Pass session ID to link/create records
    recipientName?: string // ✨ NEW: Pass name for record creation
): Promise<DeliverablesResponse> => {
    console.log(`API: Fetching deliverables for order ${orderId}, Session: ${sessionId}`);

    // 1. If we have a session ID, check for existing persistent records
    if (sessionId) {
        try {
            const existingCerts = await getCertificatesBySession(sessionId);
            
            if (existingCerts.length > 0) {
                console.log('API: Found existing persistent certificates:', existingCerts.length);
                const mappedItems: DeliverableItem[] = existingCerts.map(cert => ({
                    id: Math.floor(Math.random() * 10000), // ID isn't critical for display, just unique key
                    created_at: new Date(cert.created_at).getTime(),
                    skill_name: cert.metadata?.skill_name || 'Project Management',
                    certification_name: cert.certificate_name,
                    certification_name_short: cert.metadata?.certification_name_short || 'CERT',
                    unique_certificate_id: cert.unique_certificate_id
                }));
                
                return {
                    result: 'success',
                    message: 'Deliverables loaded from DB',
                    data: mappedItems
                };
            }
        } catch (err) {
            console.warn('API: Error checking existing certificates:', err);
        }
    }
    
    // 2. If no persistent records found, generate them from static/role data
    // Return mock deliverables based on static role data
    const mockDeliverables = HR_MANAGER_ROLE.data.role.skills.map((skill) => ({
        id: skill.id,
        created_at: Date.now(),
        skill_name: skill.skill_name,
        certification_name: skill.certificate_name || skill.skill_name,
        certification_name_short: skill.certificate_name_short || skill.skill_name,
        unique_certificate_id: `CERT-${skill.id}-${Date.now()}` // Generate NEW Unique ID
    }));

    // 3. If we have session details, PERSIST these as 'pending' records immediately
    if (sessionId && recipientName) {
        console.log('API: Persisting new certificate records...');
        // We do this in background (no await) or await if critical? Await to ensure safety.
        await Promise.all(mockDeliverables.map(item => 
            createCertificateRecord(
                sessionId,
                recipientName,
                item.certification_name,
                item.unique_certificate_id,
                { // Metadata
                    skill_name: item.skill_name,
                    certification_name_short: item.certification_name_short,
                    order_id: orderId
                }
            )
        ));
    }

    return {
        result: 'success',
        message: 'Deliverables loaded (newly generated)',
        data: mockDeliverables
    };
};

/**
 * Create certificate download link - REAL API WITH PERSISTENCE
 */
export const createCertificateDownload = async (certificateId: string, itemDetails?: Partial<DeliverableItem>): Promise<CertificateDownloadResponse> => {
    console.log(`API: generating download link for ${certificateId}`, itemDetails);
    
    // 1. Check if we already have a generated URL in DB
    try {
        const { data } = await supabase
            .from('user_certificates')
            .select('certificate_image_url, status, metadata')
            .eq('certificate_id', certificateId)
            .single();

        if (data && data.certificate_image_url && data.status === 'generated') {
            console.log('API: Returning cached certificate URL');
            return {
                result: 'success',
                message: 'Download link retrieved from cache',
                data: {
                    certificate_image_link: data.certificate_image_url
                }
            };
        }
    } catch (e) {
        console.warn('API: Cache check failed, proceeding to generate', e);
    }
    
    // 2. Prepare Data for Generation
    // Default values
    let recipientName = itemDetails?.recipient_name || 'Valued Professional';
    let certNameShort = itemDetails?.certification_name_short || 'PMPx';
    let certNameFull = itemDetails?.certification_name || 'Project Management Professional';

    // Attempt to fetch fresh data from DB record if we have the ID, as it's the most reliable source for regeneration
    try {
        const { data: certRecord } = await supabase
            .from('user_certificates')
            .select('metadata')
            .eq('certificate_id', certificateId)
            .single();
        
        if (certRecord && certRecord.metadata) {
            if (certRecord.metadata.user_name) {
                recipientName = certRecord.metadata.user_name;
            }
            if (certRecord.metadata.certificate_name) {
                certNameFull = certRecord.metadata.certificate_name;
            }
            if (certRecord.metadata.cert_short_name) {
                certNameShort = certRecord.metadata.cert_short_name;
            }
            console.log('API: Using data from DB record for generation:', { recipientName, certNameShort });
        }
    } catch (e) {
        console.warn('API: Could not fetch record details from DB, using provided fallbacks', e);
    }

    const payload = {
        first_name: recipientName.split(' ')[0],
        last_name: recipientName.split(' ').slice(1).join(' ') || ' ',
        cert_name_short: certNameShort,
        cert_name_full: certNameFull,
        unique_certificate_id: certificateId,
        date: new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    };
    
    try {
        const response = await fetch('https://xgfy-czuw-092q.m2.xano.io/api:xforge/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                format: "image_png",
                xforge_template_name: "xforge_specialized_certificate_template",
                model: {
                    first_name: payload.first_name,
                    last_name: payload.last_name,
                    cert_name_short: payload.cert_name_short,
                    cert_name_full: payload.cert_name_full,
                    unique_certificate_id: payload.unique_certificate_id,
                    date: payload.date
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Xano API Error: ${response.status}`);
        }

        const result = await response.json();
        
        console.log('Xano Certificate Response:', result);
        
        // Extract URL from the provided structure { data: { file_url: "..." } }
        const imageUrl = result.data?.file_url;

        if (imageUrl) {
            // 2. Save the generated URL to DB
            // Run in background to not block return
            updateCertificateUrl(certificateId, imageUrl).then(() => 
                console.log('API: Certificate URL persisted to DB')
            );
            
            return {
                result: 'success',
                message: 'Download link generated',
                data: {
                    certificate_image_link: imageUrl
                }
            };
        } else {
             throw new Error('No image URL in response');
        }
    } catch (error: any) {
        console.error('API: Failed to generate certificate', error);
        
        // Return a mock URL purely for testing if real API fails and in DEV
        const mockUrl = `https://placehold.co/800x600/png?text=${encodeURIComponent(certNameShort + ' - ' + recipientName)}`;
        return {
            result: 'error', 
            message: 'Generation failed, using mock',
            data: { certificate_image_link: mockUrl }
        };
    }
};

/**
 * Create or update user assessment record
 */
export const createUserAssessment = async (data: {
    session_id: number;
    user_id?: number;
    role_id?: number;
    assessment_id?: number;
    current_phase_id?: number;
    user_answers?: any;
    score?: number;
    is_passed?: boolean;
    is_complete?: boolean;
    time_taken?: number;
}) => {
    console.log('API: Creating/updating user assessment:', data);
    
    try {
        // First check if assessment already exists for this session
        const { data: existingData } = await supabase
            .from('user_assessments')
            .select('id, current_phase_id, user_answers')
            .eq('session_id', data.session_id)
            .single();

        let result;
        if (existingData) {
            // Update existing assessment
            const updatedData = { ...data };
            // Merge user_answers if both exist
            if (existingData.user_answers && data.user_answers) {
                updatedData.user_answers = {
                    ...existingData.user_answers,
                    ...data.user_answers
                };
            }
            
            result = await supabase
                .from('user_assessments')
                .update(updatedData)
                .eq('id', existingData.id)
                .select()
                .single();
        } else {
            // Create new assessment
            result = await supabase
                .from('user_assessments')
                .insert(data)
                .select()
                .single();
        }

        if (result.error) {
            console.error('Failed to save user assessment:', result.error);
            throw result.error;
        }

        console.log('User assessment saved successfully:', result.data);
        return {
            result: 'success',
            message: 'Assessment saved',
            data: result.data
        };
    } catch (error) {
        console.error('Error in createUserAssessment:', error);
        throw error;
    }
};

/**
 * Update assessment phase progress
 */
export const updateAssessmentPhase = async (
    sessionId: number, 
    phaseNumber: number, 
    phaseAnswers: any,
    timeTaken?: number
) => {
    console.log(`API: Updating assessment phase ${phaseNumber} for session ${sessionId}`);
    
    try {
        // Get the actual phase ID from phase number
        const { data: phaseData } = await supabase
            .from('assessment_phases')
            .select('id')
            .eq('order_index', phaseNumber)
            .single();

        const phaseId = phaseData?.id;
        if (!phaseId) {
            console.warn(`No phase found for order_index ${phaseNumber}`);
        }

        // Get existing assessment
        const { data: existingData } = await supabase
            .from('user_assessments')
            .select('id, user_answers, time_taken, current_phase_id')
            .eq('session_id', sessionId)
            .single();

        if (!existingData) {
            // Create new assessment if it doesn't exist
            return await createUserAssessment({
                session_id: sessionId,
                current_phase_id: phaseId || null,
                user_answers: { [phaseNumber]: phaseAnswers },
                time_taken: timeTaken || 0,
                is_complete: false
            });
        }

        // Update existing assessment with new phase data
        const updatedAnswers = {
            ...(existingData.user_answers || {}),
            [phaseNumber]: phaseAnswers
        };

        const { error } = await supabase
            .from('user_assessments')
            .update({
                current_phase_id: phaseId || existingData.current_phase_id,
                user_answers: updatedAnswers,
                time_taken: (existingData.time_taken || 0) + (timeTaken || 0)
            })
            .eq('id', existingData.id);

        if (error) {
            console.error('Failed to update assessment phase:', error);
            throw error;
        }

        console.log(`Assessment phase ${phaseNumber} updated successfully`);
        return {
            result: 'success',
            message: 'Phase updated',
            data: { phase_number: phaseNumber, phase_id: phaseId }
        };
    } catch (error) {
        console.error('Error in updateAssessmentPhase:', error);
        throw error;
    }
};

/**
 * Complete assessment with final score
 */
export const completeAssessment = async (
    sessionId: number,
    finalScore: number,
    isPassed: boolean,
    totalTimeTaken: number
) => {
    console.log(`API: Completing assessment for session ${sessionId}`);
    
    try {
        const { error } = await supabase
            .from('user_assessments')
            .update({
                score: finalScore,
                is_passed: isPassed,
                is_complete: true,
                time_taken: totalTimeTaken
            })
            .eq('session_id', sessionId);

        if (error) {
            console.error('Failed to complete assessment:', error);
            throw error;
        }

        console.log('Assessment completed successfully');
        return {
            result: 'success',
            message: 'Assessment completed',
            data: { score: finalScore, passed: isPassed }
        };
    } catch (error) {
        console.error('Error in completeAssessment:', error);
        throw error;
    }
};

/**
 * Get user assessment data from database by session ID
 */
export const getUserAssessmentBySession = async (sessionId: number | string) => {
    console.log(`API: Fetching user assessment for session ${sessionId}`);
    
    try {
        const { data, error } = await supabase
            .from('user_assessments')
            .select(`
                id,
                session_id,
                user_id,
                role_id,
                assessment_id,
                score,
                is_passed,
                is_complete,
                user_answers,
                time_taken,
                created_at,
                current_phase_id
            `)
            .eq('session_id', sessionId)
            .single();

        if (error) {
            console.error('Failed to fetch user assessment:', error);
            throw error;
        }

        if (!data) {
            throw new Error('No assessment found for this session');
        }

        console.log('User assessment fetched successfully:', data);
        return {
            result: 'success',
            message: 'Assessment data retrieved',
            data
        };
    } catch (error) {
        console.error('Error in getUserAssessmentBySession:', error);
        throw error;
    }
};

/**
 * Get certificates for a specific role
 */
export const getCertificatesByRole = async (roleId: number) => {
    console.log(`API: Fetching certificates for role ${roleId}`);
    
    try {
        const { data, error } = await supabase
            .from('role_certificates')
            .select(`
                id,
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
            `)
            .eq('role_id', roleId)
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Failed to fetch certificates:', error);
            throw error;
        }

        console.log('Certificates fetched successfully:', data);
        return {
            result: 'success',
            message: 'Certificates retrieved',
            data: data || []
        };
    } catch (error) {
        console.error('Error in getCertificatesByRole:', error);
        throw error;
    }
};

/**
 * Generate Certificate Images - Generate images for certificates that need them
 */
export const generateCertificateImages = async (
    sessionId: string
): Promise<{
    success: boolean;
    certificates_processed: number;
    certificates_generated: number;
    certificates_up_to_date: number;
    certificates: Array<{
        certificate_id: string;
        status: 'generated' | 'up_to_date' | 'failed';
        image_url?: string;
        expires_at?: string;
        error?: string;
    }>;
}> => {
    console.log(`API: Generating certificate images for session ${sessionId}`);
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-certificate-images`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                session_id: sessionId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Certificate image generation error:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        console.log('Certificate image generation response:', result);
        
        return result;
    } catch (error) {
        console.error('Error generating certificate images:', error);
        throw error;
    }
};

/**
 * Generate User Certificates via Supabase Edge Function
 * @deprecated Use processPaymentWebhook + generateCertificateImages instead
 */
export const generateUserCertificates = async (
    sessionId: string, 
    orderId: string
): Promise<{
    success: boolean;
    certificates_generated: number;
    certificates: Array<{
        certificate_id: string;
        status: 'pending' | 'generated' | 'failed';
        image_url?: string;
        error?: string;
    }>;
}> => {
    console.log(`API: [DEPRECATED] Generating certificates for session ${sessionId}, order ${orderId}`);
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-user-certificates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                session_id: sessionId,
                order_id: orderId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Certificate generation API error:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        console.log('Certificate generation response:', result);
        
        return result;
    } catch (error) {
        console.error('Error generating user certificates:', error);
        throw error;
    }
};

/**
 * Get User Certificates by Session ID
 */
export const getUserCertificates = async (sessionId: string) => {
    console.log(`API: Fetching user certificates for session ${sessionId}`);
    
    try {
        // First get the user_id from session
        const { data: sessionData, error: sessionError } = await supabase
            .from('sessions')
            .select('user_id')
            .eq('id', sessionId)
            .single();

        if (sessionError || !sessionData?.user_id) {
            console.error('Failed to get session data:', sessionError);
            return [];
        }

        const { data, error } = await supabase
            .from('user_certificates')
            .select(`
                id,
                certificate_id,
                certificate_image_url,
                certificate_image_expires_at,
                status,
                issued_at,
                metadata,
                role_certificates!inner(
                    name,
                    short_name,
                    certificate_name,
                    preview_image
                )
            `)
            .eq('user_id', sessionData.user_id)
            .order('issued_at', { ascending: true });

        if (error) {
            console.error('Failed to fetch user certificates:', error);
            return [];
        }

        // Check for expired images and mark them as needing regeneration
        const now = new Date();
        const processedCerts = (data || []).map(cert => ({
            ...cert,
            image_expired: cert.certificate_image_expires_at && 
                           new Date(cert.certificate_image_expires_at) <= now,
            needs_generation: !cert.certificate_image_url || 
                             (cert.certificate_image_expires_at && 
                              new Date(cert.certificate_image_expires_at) <= now)
        }));

        console.log('User certificates fetched successfully:', processedCerts.length);
        return processedCerts;
    } catch (error) {
        console.error('Error in getUserCertificates:', error);
        return [];
    }
};

/**
 * Get User Certificates for a specific payment
 */
export const getUserCertificatesForPayment = async (sessionId: string, paymentId: string) => {
    console.log(`API: Fetching user certificates for session ${sessionId} and payment ${paymentId}`);
    
    try {
        // First get the user_id from session
        const { data: sessionData, error: sessionError } = await supabase
            .from('sessions')
            .select('user_id')
            .eq('id', sessionId)
            .single();

        if (sessionError || !sessionData?.user_id) {
            console.error('Failed to get session data:', sessionError);
            return [];
        }

        const { data, error } = await supabase
            .from('user_certificates')
            .select(`
                id,
                certificate_id,
                certificate_image_url,
                certificate_image_expires_at,
                status,
                issued_at,
                metadata,
                role_certificates!inner(
                    name,
                    short_name,
                    certificate_name,
                    type
                )
            `)
            .eq('user_id', sessionData.user_id)
            .contains('metadata', { razorpay_payment_id: paymentId })
            .order('issued_at', { ascending: true });

        if (error) {
            console.error('Failed to fetch user certificates for payment:', error);
            return [];
        }

        // Check for expired images and mark them as needing regeneration
        const now = new Date();
        const processedCerts = (data || []).map(cert => ({
            ...cert,
            image_expired: cert.certificate_image_expires_at && 
                           new Date(cert.certificate_image_expires_at) <= now,
            needs_generation: !cert.certificate_image_url || 
                             (cert.certificate_image_expires_at && 
                              new Date(cert.certificate_image_expires_at) <= now)
        }));

        console.log(`User certificates for payment ${paymentId} fetched successfully:`, processedCerts.length);
        return processedCerts;
    } catch (error) {
        console.error('Error in getUserCertificatesForPayment:', error);
        return [];
    }
};

export const getPackDeliverablesForPayment = async (orderId: string) => {
    console.log(`API: Fetching pack deliverables for order ${orderId}`);
    try {
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('id, metadata')
            .eq('id', orderId)
            .single();

        if (orderError || !orderData) {
            console.error('Failed to get order data:', orderError);
            return null;
        }

        // Try from metadata first
        if (orderData.metadata && orderData.metadata.pack_deliverables) {
             const deliverables = typeof orderData.metadata.pack_deliverables === 'string' 
                ? JSON.parse(orderData.metadata.pack_deliverables)
                : orderData.metadata.pack_deliverables;
             return deliverables;
        }

        // If not in metadata, fetch from grants tables
        const { data: courseGrants, error: courseError } = await supabase
            .from('course_grants')
            .select('course_name, course_description')
            .eq('order_id', orderData.id);

        const { data: freeGrants, error: freeError } = await supabase
            .from('free_item_grants')
            .select('item_name, item_description')
            .eq('order_id', orderData.id);

        if (!courseError && !freeError) {
            return {
                courses: (courseGrants || []).map(c => ({ name: c.course_name, description: c.course_description })),
                freeItems: (freeGrants || []).map(f => ({ name: f.item_name, description: f.item_description }))
            };
        }

        return null;
    } catch (error) {
        console.error('Error in getPackDeliverablesForPayment:', error);
        return null;
    }
};

/**
 * Get User Certificates by User ID
 */
export const getUserCertificatesByUserId = async (userId: number) => {
    console.log(`API: Fetching user certificates for user ${userId}`);
    
    try {
        const { data, error } = await supabase
            .from('user_certificates')
            .select(`
                id,
                certificate_id,
                certificate_image_url,
                status,
                issued_at,
                role_certificates!inner(
                    name,
                    short_name,
                    certificate_name,
                    preview_image
                )
            `)
            .eq('user_id', userId)
            .order('issued_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch user certificates by user ID:', error);
            return [];
        }

        console.log('User certificates by user ID fetched successfully:', data);
        return data || [];
    } catch (error) {
        console.error('Error in getUserCertificatesByUserId:', error);
        return [];
    }
};

/**
 * Get comprehensive user data by email for admin conversion research calls
 */
export const getUserByEmail = async (email: string): Promise<UserLookupResponse> => {
    console.log(`API: Looking up user data for email: ${email}`);
    
    try {
        // 1. Get user profile
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name, email, phone_number, created_at, last_login_at')
            .eq('email', email)
            .single();

        if (userError || !userData) {
            console.log('User not found:', userError);
            return {
                result: 'not_found',
                message: 'User not found with this email',
                data: null
            };
        }

        const userId = userData.id;
        console.log(`Found user ${userId}, fetching additional data...`);

        // 2. Get all sessions for this user
        const { data: sessionsData, error: sessionsError } = await supabase
            .from('sessions')
            .select('id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, role, created_at, user_agent, ip_address')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (sessionsError) {
            console.warn('Error fetching sessions:', sessionsError);
        }

        const sessions = sessionsData || [];
        const sessionIds = sessions.map(s => s.id);

        // 3. Get all assessments for this user
        const { data: assessmentsData, error: assessmentsError } = await supabase
            .from('user_assessments')
            .select('id, session_id, score, is_passed, is_complete, time_taken, created_at, role_id, current_phase_id, user_answers')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (assessmentsError) {
            console.warn('Error fetching assessments:', assessmentsError);
        }

        const assessments = assessmentsData || [];

        // 4. Get all orders for this user (both user_id and session_id based)
        let ordersData = [];
        if (sessionIds.length > 0) {
            const { data: sessionOrders, error: sessionOrdersError } = await supabase
                .from('orders')
                .select('id, user_id, session_id, amount, currency, status, razorpay_order_id, razorpay_payment_id, created_at, metadata')
                .or(`user_id.eq.${userId},session_id.in.(${sessionIds.join(',')})`)
                .order('created_at', { ascending: false });

            if (sessionOrdersError) {
                console.warn('Error fetching orders:', sessionOrdersError);
            }
            ordersData = sessionOrders || [];
        } else {
            const { data: userOrders, error: userOrdersError } = await supabase
                .from('orders')
                .select('id, user_id, session_id, amount, currency, status, razorpay_order_id, razorpay_payment_id, created_at, metadata')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (userOrdersError) {
                console.warn('Error fetching orders:', userOrdersError);
            }
            ordersData = userOrders || [];
        }

        // 5. Get all purchases for this user
        const { data: purchasesData, error: purchasesError } = await supabase
            .from('purchases')
            .select('id, order_id, role_certificate_id, purchased_at')
            .eq('user_id', userId)
            .order('purchased_at', { ascending: false });

        if (purchasesError) {
            console.warn('Error fetching purchases:', purchasesError);
        }

        const purchases = purchasesData || [];

        // 6. Get tracking events timeline (limit to recent events to avoid overwhelming data)
        interface TimelineEvent {
            event: string;
            timestamp: string;
            session_id: string;
            details: {
                page_url?: string;
                [key: string]: any;
            };
        }
        
        let timelineEvents: TimelineEvent[] = [];
        if (sessionIds.length > 0) {
            const { data: eventsData, error: eventsError } = await supabase
                .from('tracking_events')
                .select('event_name, event_data, session_id, created_at, page_url')
                .in('session_id', sessionIds.map(id => id.toString()))
                .order('created_at', { ascending: false })
                .limit(50); // Limit to recent 50 events

            if (eventsError) {
                console.warn('Error fetching tracking events:', eventsError);
            }

            timelineEvents = (eventsData || []).map(event => ({
                event: event.event_name,
                timestamp: event.created_at,
                session_id: event.session_id,
                details: {
                    ...event.event_data,
                    page_url: event.page_url
                }
            }));
        }

        // 7. Calculate conversion status
        const hasAssessment = assessments.length > 0;
        const hasPassedAssessment = assessments.some(a => a.is_passed);
        const hasOrder = ordersData.length > 0;
        const hasPaidOrder = ordersData.some(o => o.status === 'paid');
        const hasPurchase = purchases.length > 0;

        const lookupData: UserLookupData = {
            profile: userData,
            sessions,
            assessments,
            orders: ordersData,
            purchases,
            timeline: timelineEvents,
            conversionStatus: {
                hasAssessment,
                hasPassedAssessment,
                hasOrder,
                hasPaidOrder,
                hasPurchase
            }
        };

        console.log('User lookup completed successfully for:', email);
        return {
            result: 'success',
            message: 'User data retrieved successfully',
            data: lookupData
        };

    } catch (error) {
        console.error('Error in getUserByEmail:', error);
        return {
            result: 'error',
            message: 'Failed to retrieve user data',
            data: null
        };
    }
};
