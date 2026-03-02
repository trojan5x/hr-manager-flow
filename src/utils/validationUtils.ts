/**
 * Validation utilities for role generation
 * 
 * Additional validation helpers and error handling utilities
 * to complement the main role service validation.
 */

import type {
  GeneratedRoleData,
  ValidationError,
  QuestionOption
} from '../types/roleGeneration';
import { PRICING_TIERS } from '../types/roleGeneration';

/**
 * Validates SVG content for security and structure
 */
export const validateSVGContent = (svgString: string): { isValid: boolean; error?: string } => {
  try {
    // Check for basic SVG structure
    if (!svgString.includes('<svg') || !svgString.includes('</svg>')) {
      return { isValid: false, error: 'SVG must contain opening and closing svg tags' };
    }

    // Check for potentially dangerous content
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // onclick, onload, etc.
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(svgString)) {
        return { isValid: false, error: 'SVG contains potentially dangerous content' };
      }
    }

    // Check for required attributes
    if (!svgString.includes('viewBox=')) {
      return { isValid: false, error: 'SVG must include viewBox attribute' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Failed to validate SVG content' };
  }
};

/**
 * Validates question options for correct structure
 */
export const validateQuestionOptions = (options: QuestionOption[]): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (options.length !== 4) {
    errors.push({ field: 'options', message: 'Exactly 4 options required' });
    return errors;
  }

  const requiredIds: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const foundIds = options.map(opt => opt.option_id);
  
  for (const requiredId of requiredIds) {
    if (!foundIds.includes(requiredId)) {
      errors.push({ field: 'options', message: `Missing option ${requiredId}` });
    }
  }

  const correctAnswers = options.filter(opt => opt.is_correct);
  if (correctAnswers.length !== 1) {
    errors.push({ field: 'options', message: `Exactly 1 correct answer required, found ${correctAnswers.length}` });
  }

  // Check for empty or very short option texts
  options.forEach((option, index) => {
    if (!option.text || option.text.trim().length < 5) {
      errors.push({ field: `options[${index}]`, message: 'Option text must be at least 5 characters long' });
    }
  });

  return errors;
};

/**
 * Validates role name for URL safety and uniqueness requirements
 */
export const validateRoleName = (roleName: string): { isValid: boolean; error?: string } => {
  if (!roleName || roleName.trim().length === 0) {
    return { isValid: false, error: 'Role name is required' };
  }

  if (roleName.trim().length < 3) {
    return { isValid: false, error: 'Role name must be at least 3 characters long' };
  }

  if (roleName.trim().length > 50) {
    return { isValid: false, error: 'Role name must be less than 50 characters' };
  }

  // Check for special characters that might cause issues
  const invalidChars = /[<>\"'&\\\/\[\]{}|`~!@#$%^*()+=]/;
  if (invalidChars.test(roleName)) {
    return { isValid: false, error: 'Role name contains invalid characters' };
  }

  return { isValid: true };
};

/**
 * Generates a safe slug from role name
 */
export const generateSlugFromRoleName = (roleName: string): string => {
  return roleName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Validates framework names for consistency
 */
export const validateFrameworks = (frameworks: string[]): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (frameworks.length !== 5) {
    errors.push({ field: 'frameworks', message: 'Exactly 5 frameworks required' });
    return errors;
  }

  frameworks.forEach((framework, index) => {
    if (!framework || framework.trim().length === 0) {
      errors.push({ field: `frameworks[${index}]`, message: 'Framework name cannot be empty' });
    } else if (framework.length < 2 || framework.length > 20) {
      errors.push({ field: `frameworks[${index}]`, message: 'Framework name must be 2-20 characters long' });
    } else if (!framework.endsWith('x') && !framework.endsWith('X')) {
      errors.push({ field: `frameworks[${index}]`, message: 'Framework names should end with "x" for consistency' });
    }
  });

  // Check for duplicates
  const uniqueFrameworks = [...new Set(frameworks.map(f => f.toLowerCase()))];
  if (uniqueFrameworks.length !== frameworks.length) {
    errors.push({ field: 'frameworks', message: 'Duplicate framework names not allowed' });
  }

  return errors;
};

/**
 * Validates pricing against expected tiers
 */
export const validateCertificatePricing = (
  certificateType: string,
  orderIndex: number,
  price: number,
  originalPrice: number
): { isValid: boolean; error?: string } => {
  const expectedPricing = getPricingTier(certificateType, orderIndex);
  
  if (!expectedPricing) {
    return { isValid: false, error: 'Unknown certificate type or order combination' };
  }

  if (price !== expectedPricing.price) {
    return { 
      isValid: false, 
      error: `Expected price ${expectedPricing.price}, got ${price}` 
    };
  }

  if (originalPrice !== expectedPricing.original) {
    return { 
      isValid: false, 
      error: `Expected original price ${expectedPricing.original}, got ${originalPrice}` 
    };
  }

  return { isValid: true };
};

/**
 * Helper to get expected pricing tier
 */
const getPricingTier = (type: string, order: number) => {
  if (type === 'default' && order === 1) return PRICING_TIERS.default_1;
  if (type === 'default' && order === 2) return PRICING_TIERS.default_2;
  if (type === 'secondary' && order === 3) return PRICING_TIERS.secondary_1;
  if (type === 'secondary' && order === 4) return PRICING_TIERS.secondary_2;
  if (type === 'ai') return PRICING_TIERS.ai;
  return null;
};

/**
 * Sanitizes user input to prevent XSS and other security issues
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Validates JSON string size and complexity
 */
export const validateJSONSize = (jsonString: string): { isValid: boolean; error?: string } => {
  const maxSize = 1024 * 1024; // 1MB
  const size = new Blob([jsonString]).size;

  if (size > maxSize) {
    return { isValid: false, error: `JSON too large: ${(size / 1024).toFixed(1)}KB (max 1MB)` };
  }

  // Count nesting depth to prevent stack overflow
  let depth = 0;
  let maxDepth = 0;
  
  for (const char of jsonString) {
    if (char === '{' || char === '[') {
      depth++;
      maxDepth = Math.max(maxDepth, depth);
    } else if (char === '}' || char === ']') {
      depth--;
    }
  }

  if (maxDepth > 20) {
    return { isValid: false, error: `JSON too deeply nested: ${maxDepth} levels (max 20)` };
  }

  return { isValid: true };
};

/**
 * Formats validation errors for display
 */
export const formatValidationErrors = (errors: ValidationError[]): string => {
  if (errors.length === 0) return '';

  const errorsByField = errors.reduce((acc, error) => {
    const field = error.field || 'general';
    if (!acc[field]) acc[field] = [];
    acc[field].push(error.message);
    return acc;
  }, {} as Record<string, string[]>);

  const formatted = Object.entries(errorsByField)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');

  return formatted;
};

/**
 * Creates a comprehensive validation report
 */
export const createValidationReport = (data: GeneratedRoleData): {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    warningsCount: number;
  };
} => {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Role name validation
  const roleNameValidation = validateRoleName(data.role.role_name);
  if (!roleNameValidation.isValid) {
    errors.push({ field: 'role.role_name', message: roleNameValidation.error! });
  }

  // Framework validation
  const frameworkErrors = validateFrameworks(data.role.frameworks);
  errors.push(...frameworkErrors);

  // Certificate validation
  data.certificates.forEach((cert) => {
    const pricingValidation = validateCertificatePricing(
      cert.type,
      cert.order_index,
      cert.price,
      cert.original_price
    );
    if (!pricingValidation.isValid) {
      warnings.push(`Certificate ${cert.name}: ${pricingValidation.error}`);
    }
  });

  // Scenario SVG validation
  data.scenarios.forEach((scenario, index) => {
    const svgValidation = validateSVGContent(scenario.visual_model.svg);
    if (!svgValidation.isValid) {
      errors.push({ 
        field: `scenarios[${index}].visual_model.svg`, 
        message: svgValidation.error! 
      });
    }
  });

  // Question validation
  data.questions.forEach((question, index) => {
    const optionErrors = validateQuestionOptions(question.options);
    optionErrors.forEach(error => {
      errors.push({ 
        field: `questions[${index}].${error.field}`, 
        message: error.message 
      });
    });
  });

  const criticalIssues = errors.filter(error => 
    error.field.includes('role.') || 
    error.field.includes('certificates') ||
    error.field.includes('questions')
  ).length;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalIssues: errors.length + warnings.length,
      criticalIssues,
      warningsCount: warnings.length
    }
  };
};