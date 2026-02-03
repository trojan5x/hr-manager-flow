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
  DeliverableItem
} from '../types';
export type { CertificationItem, BundleProductData } from '../types';
import { HR_MANAGER_ROLE, MOCK_ASSESSMENT, MOCK_BUNDLE_PRODUCTS } from '../data/staticData';


// =============================================================================
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
 * Signup user - MOCK
 */
export const signupUser = async (signupData: any): Promise<any> => {
  console.log('STATIC: Signing up user', signupData);
  return {
    result: 'success',
    message: 'User signed up',
    data: { id: 123, created_at: Date.now() }
  };
};

/**
 * Search for roles - MOCK
 */
export const searchRoles = async (query: string, limit: number = 10): Promise<string[]> => {
  console.log(`STATIC: Searching roles for "${query}"`);
  const roles = ['HR Manager', 'Talent Acquisition Specialist', 'HR Business Partner', 'People Operations Manager'];
  return roles.filter(r => r.toLowerCase().includes(query.toLowerCase())).slice(0, limit);
};

import { supabase } from './supabaseClient';

/**
 * Create a new user session - REAL (Supabase)
 */
export const createSession = async (
  role: string,
  utmParams?: UrlParamsData,
  retries: number = 3
): Promise<SessionResponse> => {
  console.log('API: Creating session in Supabase', { role, utmParams });
  
  let attempt = 0;
  
  while (attempt < retries) {
      try {
          // Prepare data for insertion
          const sessionData = {
              role: role,
              utm_source: utmParams?.utm_source || null,
              utm_medium: utmParams?.utm_medium || null,
              utm_campaign: utmParams?.utm_campaign || null,
              user_agent: navigator.userAgent
          };

          const { data, error } = await supabase
              .from('sessions')
              .insert(sessionData)
              .select()
              .single();

          if (error) {
              console.warn(`Supabase session creation error (Attempt ${attempt + 1}):`, error);
              throw error;
          }

          if (!data) {
              throw new Error('No data returned from session creation');
          }

          return {
            session_id: data.session_id,
            role: role,
            created_at: data.created_at
          };
          
      } catch (error) {
          attempt++;
          console.error(`Failed to create session in Supabase (Attempt ${attempt}/${retries})`);
          
          if (attempt >= retries) {
               console.error('Critical: All session creation attempts failed.');
               // THROW ERROR - Do not use fallback. Stop the flow.
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
    userId: number | string,
    email?: string
): Promise<boolean> => {
    console.log(`API: Linking Session ${sessionId} to User ${userId}`);
    try {
        const updates: any = {
            user_id: userId
        };
        // If email column exists in sessions, we can update it too, but user_id is key
        if (email) updates.user_email = email; // Optional, assuming column might exist or just for log

        const { error } = await supabase
            .from('sessions')
            .update(updates)
            .eq('session_id', sessionId);

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
 * Fetch bundle with scenarios - MOCK
 */
export const fetchBundleScenarios = async (
  bundleId: string | number,
  _waitForUpdates: boolean = false,
  _timeoutSeconds: number = 30
): Promise<ScenariosResponse> => {
  console.log(`STATIC: Fetching scenarios for bundle ${bundleId}`);
  return MOCK_ASSESSMENT;
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

const PAYMENT_API_URL = 'https://xgfy-czuw-092q.m2.xano.io/api:IfQi_Nyx/mcp/razorpay_order';

/**
 * Create Payment Order (Real API)
 */
export const createPaymentOrder = async (
    amount: number, 
    purchasedProducts: string, 
    projectName: string = 'experiment-certifications', 
    additionalNotes: any = {}
) => {
  try {
    const requestBody = {
      amount: amount * 100, // Convert to paise (multiply by 100)
      notes: {
        project_name: projectName,
        purchased_products: purchasedProducts,
        ...additionalNotes // Spread the additional notes (user details, etc.)
      }
    };

    const response = await fetch(`${PAYMENT_API_URL}/create_order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    // Start of Selection
    return result.response ? result.response.result : result; 
  } catch (error) {
    console.error('Error creating payment order:', error);
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
    recipientName: string,
    certName: string,
    uniqueId: string,
    metadata: any = {} // ✨ NEW: Accept metadata
): Promise<CertificateRecord | null> => {
    console.log(`API: Creating certificate record for ${uniqueId}`);
    
    try {
        const { data, error } = await supabase
            .from('certificates')
            .insert({
                session_id: sessionId,
                recipient_name: recipientName,
                certificate_name: certName,
                unique_certificate_id: uniqueId,
                status: 'pending',
                metadata: metadata // ✨ NEW: Store metadata
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
            .from('certificates')
            .update({
                image_url: url,
                status: 'generated'
            })
            .eq('unique_certificate_id', uniqueId);

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
            .from('certificates')
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
}

/**
 * Get Payment Analytics - For Admin Dashboard
 * Fetches all successful payments and calculates metrics
 */
export const getPaymentAnalytics = async (): Promise<PaymentAnalytics> => {
    try {
        const { data, error } = await supabase
            .from('sessions')
            .select('amount_paid, is_paid, payment_id')
            .eq('is_paid', true)
            .not('amount_paid', 'is', null);

        if (error) {
            console.error('Error fetching payment analytics:', error);
            return {
                totalRevenue: 0,
                averageOrderValue: 0,
                totalOrders: 0,
                successfulPayments: 0
            };
        }

        // Calculate metrics
        const successfulPayments = data?.length || 0;
        const totalRevenue = data?.reduce((sum, session) => sum + (session.amount_paid || 0), 0) || 0;
        const averageOrderValue = successfulPayments > 0 ? totalRevenue / successfulPayments : 0;

        return {
            totalRevenue,
            averageOrderValue: Math.round(averageOrderValue * 100) / 100, // Round to 2 decimal places
            totalOrders: successfulPayments,
            successfulPayments
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
            .from('certificates')
            .select('image_url, status, recipient_name, metadata')
            .eq('unique_certificate_id', certificateId)
            .single();

        if (data && data.image_url && data.status === 'generated') {
            console.log('API: Returning cached certificate URL');
            return {
                result: 'success',
                message: 'Download link retrieved from cache',
                data: {
                    certificate_image_link: data.image_url
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
            .from('certificates')
            .select('recipient_name, metadata, certificate_name')
            .eq('unique_certificate_id', certificateId)
            .single();
        
        if (certRecord) {
            if (certRecord.recipient_name) {
                recipientName = certRecord.recipient_name;
            }
            if (certRecord.certificate_name) {
                certNameFull = certRecord.certificate_name;
            }
            if (certRecord.metadata?.certification_name_short) {
                certNameShort = certRecord.metadata.certification_name_short;
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
