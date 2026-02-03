/**
 * Utility functions for managing localStorage operations
 */

import type { UrlParamsData, StoredUserData, UserAnswer } from '../types';

const STORAGE_KEYS = {
  USER_DATA: 'userData',
  USER_DETAILS: 'userDetails' // Keep for backwards compatibility
} as const;

/**
 * Store URL parameters and email in localStorage
 */
export const storeUrlParams = (urlParams: UrlParamsData, email?: string): void => {
  try {
    const existingData = getUserData();
    const updatedData: StoredUserData = {
      ...existingData,
      urlParams,
      timestamp: Date.now()
    };
    
    // Only update email if provided
    if (email) {
      updatedData.email = email;
    }
    
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedData));
    console.log('Stored URL parameters:', urlParams);
    if (email) {
      console.log('Stored email:', email);
    }
  } catch (error) {
    console.error('Error storing URL parameters:', error);
  }
};

/**
 * Store email separately in localStorage
 */
export const storeEmail = (email: string): void => {
  try {
    const existingData = getUserData();
    const updatedData: StoredUserData = {
      ...existingData,
      email,
      timestamp: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedData));
    console.log('Stored email:', email);
  } catch (error) {
    console.error('Error storing email:', error);
  }
};

/**
 * Get stored user data from localStorage
 */
export const getUserData = (): StoredUserData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error retrieving user data:', error);
  }
  
  return { timestamp: Date.now() };
};

/**
 * Get stored URL parameters
 */
export const getStoredUrlParams = (): UrlParamsData | undefined => {
  const userData = getUserData();
  return userData.urlParams;
};

/**
 * Store contact details (for backwards compatibility)
 */
export const storeContactDetails = (contactDetails: { email: string; phone: string; name?: string }): void => {
  try {
    const existingData = getUserData();
    const updatedData: StoredUserData = {
      ...existingData,
      contactDetails,
      timestamp: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedData));
    // Also store in old format for backwards compatibility
    localStorage.setItem(STORAGE_KEYS.USER_DETAILS, JSON.stringify(contactDetails));
    console.log('Stored contact details:', contactDetails);
  } catch (error) {
    console.error('Error storing contact details:', error);
  }
};

/**
 * Clear all user data from localStorage
 */
export const clearUserData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.USER_DETAILS);
    console.log('Cleared user data');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

/**
 * Clear all user data from localStorage
 */
export const clearAssessmentData = () => {
    localStorage.removeItem('answersBackup');
    localStorage.removeItem('progressBackup');
    localStorage.removeItem('bundle_id');
    localStorage.removeItem('session_id'); // Optional: keep if needed for results
    // Don't clear roleContent as it might be needed if they start over
};

/**
 * Check if user data exists in localStorage
 */
export const hasUserData = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.USER_DATA) !== null;
};

/**
 * Store role parameter in localStorage
 */
export const storeRole = (role: string): void => {
  try {
    const existingData = getUserData();
    const updatedData: StoredUserData = {
      ...existingData,
      role,
      timestamp: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedData));
    console.log('Stored role parameter:', role);
  } catch (error) {
    console.error('Error storing role parameter:', error);
  }
};

/**
 * Get stored role from localStorage
 */
export const getStoredRole = (): string | undefined => {
  const userData = getUserData();
  return userData.role;
};

/**
 * Get stored email from localStorage
 */
export const getStoredEmail = (): string | undefined => {
  const userData = getUserData();
  return userData.email;
};

/**
 * Get user's email from multiple sources (prioritized)
 */
export const getUserEmail = (): string | undefined => {
  const userData = getUserData();
  
  // Priority 1: Top-level email from URL
  if (userData.email) {
    return userData.email;
  }
  
  // Priority 2: Contact details email (form input)
  if (userData.contactDetails?.email) {
    return userData.contactDetails.email;
  }
  
  return undefined;
};

/**
 * Get user's name from stored details
 */
export const getUserName = (): string | undefined => {
  try {
    // Try getting from userDetails key first (set by ContactDetailsPage)
    const userDetailsStr = localStorage.getItem(STORAGE_KEYS.USER_DETAILS);
    if (userDetailsStr) {
      const details = JSON.parse(userDetailsStr);
      if (details.name) return details.name;
    }

    // Try getting from raw userName key (legacy/fallback)
    const rawUserName = localStorage.getItem('userName');
    if (rawUserName) return rawUserName;
    
    // Fallback to userData structure
    const userData = getUserData();
    if (userData.contactDetails && (userData.contactDetails as any).name) {
      return (userData.contactDetails as any).name;
    }
  } catch (error) {
    console.error('Error getting user name:', error);
  }
  return undefined;
};

/**
 * Store session ID in localStorage
 */
export const storeSessionId = (sessionId: string): void => {
  try {
    const existingData = getUserData();
    const updatedData: StoredUserData = {
      ...existingData,
      sessionId,
      timestamp: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedData));
    console.log('Stored session ID:', sessionId);
  } catch (error) {
    console.error('Error storing session ID:', error);
  }
};

/**
 * Get stored session ID from localStorage
 */
export const getStoredSessionId = (): string | undefined => {
  const userData = getUserData();
  return userData.sessionId;
};

/**
 * Check if a valid session exists
 */
export const hasValidSession = (): boolean => {
  const sessionId = getStoredSessionId();
  return !!sessionId;
};

/**
 * Store bundle ID in localStorage
 */
export const storeBundleId = (bundleId: string | number): void => {
  try {
    localStorage.setItem('bundleId', bundleId.toString());
    console.log('Stored bundle ID:', bundleId);
  } catch (error) {
    console.error('Error storing bundle ID:', error);
  }
};

/**
 * Get bundle ID from localStorage
 */
export const getStoredBundleId = (): string | null => {
  try {
    return localStorage.getItem('bundleId');
  } catch (error) {
    console.error('Error getting bundle ID:', error);
    return null;
  }
};

/**
 * Store user answers locally as backup
 */
export const storeAnswersBackup = (bundleId: string | number, answers: UserAnswer[]): void => {
  try {
    const key = `assessment_${bundleId}_answers`;
    localStorage.setItem(key, JSON.stringify({
      answers,
      timestamp: Date.now()
    }));
    console.log(`Stored ${answers.length} answers as backup for bundle ${bundleId}`);
  } catch (error) {
    console.error('Error storing answers backup:', error);
  }
};

/**
 * Get stored answers backup from localStorage
 */
export const getStoredAnswersBackup = (bundleId: string | number): UserAnswer[] => {
  try {
    const key = `assessment_${bundleId}_answers`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const backup = JSON.parse(stored);
      console.log(`Retrieved ${backup.answers?.length || 0} answers from backup for bundle ${bundleId}`);
      return backup.answers || [];
    }
  } catch (error) {
    console.error('Error retrieving answers backup:', error);
  }
  return [];
};

/**
 * Clear answers backup from localStorage
 */
export const clearAnswersBackup = (bundleId: string | number): void => {
  try {
    const key = `assessment_${bundleId}_answers`;
    localStorage.removeItem(key);
    console.log(`Cleared answers backup for bundle ${bundleId}`);
  } catch (error) {
    console.error('Error clearing answers backup:', error);
  }
};

/**
 * Store assessment progress backup
 */
export const storeProgressBackup = (bundleId: string | number, progress: {
  currentScenario: number;
  completedScenarios: number;
  answersSaved: number;
  cumulativeTime?: number;
}): void => {
  try {
    const key = `assessment_${bundleId}_progress`;
    localStorage.setItem(key, JSON.stringify({
      ...progress,
      timestamp: Date.now()
    }));
    console.log(`Stored progress backup for bundle ${bundleId}:`, progress);
  } catch (error) {
    console.error('Error storing progress backup:', error);
  }
};

/**
 * Get stored progress backup from localStorage
 */
export const getStoredProgressBackup = (bundleId: string | number): {
  currentScenario: number;
  completedScenarios: number;
  answersSaved: number;
  cumulativeTime: number;
} | null => {
  try {
    const key = `assessment_${bundleId}_progress`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const backup = JSON.parse(stored);
      console.log(`Retrieved progress backup for bundle ${bundleId}:`, backup);
      return {
        currentScenario: backup.currentScenario || 1,
        completedScenarios: backup.completedScenarios || 0,
        answersSaved: backup.answersSaved || 0,
        cumulativeTime: backup.cumulativeTime || 0
      };
    }
  } catch (error) {
    console.error('Error retrieving progress backup:', error);
  }
  return null;
};

/**
 * Clear progress backup from localStorage
 */
export const clearProgressBackup = (bundleId: string | number): void => {
  try {
    const key = `assessment_${bundleId}_progress`;
    localStorage.removeItem(key);
    console.log(`Cleared progress backup for bundle ${bundleId}`);
  } catch (error) {
    console.error('Error clearing progress backup:', error);
  }
};

/**
 * Store phase-specific completion data
 */
export const storePhaseCompletion = (bundleId: string | number, phaseNum: number, data: any): void => {
  try {
    const key = `assessment_${bundleId}_phase_${phaseNum}_data`;
    localStorage.setItem(key, JSON.stringify({
      ...data,
      timestamp: Date.now()
    }));
    console.log(`Stored phase ${phaseNum} data for bundle ${bundleId}`);
  } catch (error) {
    console.error('Error storing phase data:', error);
  }
};

/**
 * Get all phase completion data keys
 */
export const getPhaseDataKeys = (bundleId: string | number): string[] => {
    return Object.keys(localStorage).filter(k => 
        k.startsWith(`assessment_${bundleId}_phase_`) && k.endsWith('_data')
    );
};

/**
 * Get CTA variant configuration based on utm_medium
 */
export const getCTAVariant = (): {
  ctaText: string;
  useAnimatedSubtext: boolean;
  staticSubtext?: string;
} => {
  const userData = getUserData();
  const utmMedium = userData.urlParams?.utm_medium;

  switch (utmMedium) {
    case 'static_scrum_14_v1':
      return {
        ctaText: 'Claim Your Certificate Here',
        useAnimatedSubtext: false,
        staticSubtext: 'Assessment Unlocks 100% increase in salary!'
      };
    case 'static_scrum_14_v2':
      return {
        ctaText: 'Start Global Certifications Test',
        useAnimatedSubtext: false,
        staticSubtext: 'Assessment Unlocks 100% increase in salary!'
      };
    case 'static_scrum_14_v3':
      return {
        ctaText: 'Verify My Skills & Claim Certificate',
        useAnimatedSubtext: true
      };
    default:
      // Default behavior when no utm_medium or unrecognized value
      return {
        ctaText: 'Verify My Skills & Claim Certificate',
        useAnimatedSubtext: true
      };
  }
};