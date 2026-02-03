/**
 * Utility functions for extracting and managing URL parameters
 */

import type { UrlParamsData } from '../types';

/**
 * Extract UTM parameters from current URL (email handled separately)
 */
export const extractUrlParams = (): UrlParamsData => {
  const urlParams = new URLSearchParams(window.location.search);
  
  const data: UrlParamsData = {};
  
  // Extract UTM parameters only
  const utmParams = [
    'utm_source',
    'utm_medium', 
    'utm_campaign',
    'utm_content',
    'utm_term'
  ] as const;
  
  utmParams.forEach(param => {
    const value = urlParams.get(param);
    if (value) {
      data[param] = value;
    }
  });
  
  return data;
};

/**
 * Extract email parameter from current URL
 */
export const extractEmailFromUrl = (): string | undefined => {
  const urlParams = new URLSearchParams(window.location.search);
  const email = urlParams.get('email');
  return email || undefined;
};

/**
 * Check if URL contains any trackable parameters (UTM or email)
 */
export const hasTrackableParams = (): boolean => {
  const utmData = extractUrlParams();
  const email = extractEmailFromUrl();
  return Object.keys(utmData).length > 0 || !!email;
};

/**
 * Get formatted parameter data for logging/debugging
 */
export const getFormattedParams = (): string => {
  const utmData = extractUrlParams();
  const email = extractEmailFromUrl();
  
  const parts: string[] = [];
  
  if (email) {
    parts.push(`email: ${email}`);
  }
  
  Object.entries(utmData).forEach(([key, value]) => {
    parts.push(`${key}: ${value}`);
  });
  
  if (parts.length === 0) {
    return 'No trackable parameters found';
  }
  
  return parts.join(', ');
};
