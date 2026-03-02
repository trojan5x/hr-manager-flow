/**
 * Role Service - Database operations for role management
 * 
 * This service handles all database operations related to role generation,
 * validation, insertion, and management using Supabase.
 */

import { supabase } from './supabaseClient';
import type {
  GeneratedRoleData,
  ValidationResult,
  ValidationError,
  InsertionProgress,
  InsertionProgressCallback,
  RoleInsertionResult,
  RoleDeletionResult,
  ExistingRole,
  RoleStats
} from '../types/roleGeneration';
import {
  REQUIRED_CERTIFICATE_COUNT,
  REQUIRED_SCENARIO_COUNT,
  REQUIRED_QUESTION_COUNT,
  QUESTIONS_PER_SCENARIO,
  REQUIRED_SCORECARD_STATS,
  CERTIFICATE_TYPES,
  PRICING_TIERS
} from '../types/roleGeneration';

/**
 * Validates generated role data against business rules and database constraints
 */
export const validateRoleData = (data: GeneratedRoleData): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Validate role structure
  if (!data.role) {
    errors.push({ field: 'role', message: 'Role configuration is required' });
    return { isValid: false, errors, warnings };
  }

  // Validate role fields
  if (!data.role.role_name || data.role.role_name.trim().length === 0) {
    errors.push({ field: 'role.role_name', message: 'Role name is required' });
  }

  if (!data.role.slug || data.role.slug.trim().length === 0) {
    errors.push({ field: 'role.slug', message: 'Role slug is required' });
  } else if (!/^[a-z0-9-]+$/.test(data.role.slug)) {
    errors.push({ field: 'role.slug', message: 'Slug must contain only lowercase letters, numbers, and hyphens' });
  }

  if (!data.role.frameworks || data.role.frameworks.length !== 5) {
    errors.push({ field: 'role.frameworks', message: 'Exactly 5 frameworks are required' });
  }

  // Validate certificates
  if (!data.certificates || data.certificates.length !== REQUIRED_CERTIFICATE_COUNT) {
    errors.push({ 
      field: 'certificates', 
      message: `Exactly ${REQUIRED_CERTIFICATE_COUNT} certificates are required` 
    });
  } else {
    // Validate certificate structure and pricing
    const certificateTypes = { default: 0, secondary: 0, ai: 0 };
    
    data.certificates.forEach((cert, index) => {
      const path = `certificates[${index}]`;
      
      if (!CERTIFICATE_TYPES.includes(cert.type)) {
        errors.push({ 
          field: `${path}.type`, 
          message: 'Certificate type must be "default", "secondary", or "ai"' 
        });
      } else {
        certificateTypes[cert.type]++;
      }

      // Validate pricing based on type and order
      const expectedPricing = getPricingForCertificate(cert.type, cert.order_index);
      if (expectedPricing && (cert.price !== expectedPricing.price || cert.original_price !== expectedPricing.original)) {
        warnings.push(`Certificate ${cert.name} pricing may not match expected tiers`);
      }

      // Validate required fields
      if (!cert.name || !cert.short_name || !cert.cert_id_prefix) {
        errors.push({ field: `${path}`, message: 'Certificate name, short_name, and cert_id_prefix are required' });
      }

      if (!cert.skill_frameworks || cert.skill_frameworks.length !== 3) {
        errors.push({ field: `${path}.skill_frameworks`, message: 'Exactly 3 skill frameworks required per certificate' });
      }
    });

    // Validate certificate type distribution
    if (certificateTypes.default !== 2) {
      errors.push({ field: 'certificates', message: 'Exactly 2 certificates must have type "default"' });
    }
    if (certificateTypes.secondary !== 2) {
      errors.push({ field: 'certificates', message: 'Exactly 2 certificates must have type "secondary"' });
    }
    if (certificateTypes.ai !== 1) {
      errors.push({ field: 'certificates', message: 'Exactly 1 certificate must have type "ai"' });
    }
  }

  // Validate scenarios
  if (!data.scenarios || data.scenarios.length !== REQUIRED_SCENARIO_COUNT) {
    errors.push({ 
      field: 'scenarios', 
      message: `Exactly ${REQUIRED_SCENARIO_COUNT} scenarios are required` 
    });
  } else {
    data.scenarios.forEach((scenario, index) => {
      const path = `scenarios[${index}]`;
      
      if (!scenario.name || !scenario.context || !scenario.task) {
        errors.push({ field: `${path}`, message: 'Scenario name, context, and task are required' });
      }

      if (!scenario.key_concepts || scenario.key_concepts.length !== 6) {
        errors.push({ field: `${path}.key_concepts`, message: 'Exactly 6 key concepts required per scenario' });
      }

      if (!scenario.visual_model || !scenario.visual_model.svg) {
        errors.push({ field: `${path}.visual_model`, message: 'Visual model with SVG is required' });
      }

      if (!scenario.project_mandate || !scenario.project_mandate.high_level_goal) {
        errors.push({ field: `${path}.project_mandate`, message: 'Project mandate with high level goal is required' });
      }
    });
  }

  // Validate questions
  if (!data.questions || data.questions.length !== REQUIRED_QUESTION_COUNT) {
    errors.push({ 
      field: 'questions', 
      message: `Exactly ${REQUIRED_QUESTION_COUNT} questions are required` 
    });
  } else {
    // Group questions by scenario to validate distribution
    const questionsByScenario = data.questions.reduce((acc, question) => {
      acc[question.scenario_index] = (acc[question.scenario_index] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Validate 5 questions per scenario
    for (let i = 0; i < REQUIRED_SCENARIO_COUNT; i++) {
      if (questionsByScenario[i] !== QUESTIONS_PER_SCENARIO) {
        errors.push({ 
          field: `questions`, 
          message: `Scenario ${i + 1} must have exactly ${QUESTIONS_PER_SCENARIO} questions` 
        });
      }
    }

    // Validate question structure
    data.questions.forEach((question, index) => {
      const path = `questions[${index}]`;
      
      if (!question.question_text) {
        errors.push({ field: `${path}.question_text`, message: 'Question text is required' });
      }

      if (!question.options || question.options.length !== 4) {
        errors.push({ field: `${path}.options`, message: 'Exactly 4 options required per question' });
      } else {
        const correctAnswers = question.options.filter(opt => opt.is_correct);
        if (correctAnswers.length !== 1) {
          errors.push({ field: `${path}.options`, message: 'Exactly 1 correct answer required per question' });
        }

        const optionIds = question.options.map(opt => opt.option_id);
        const expectedIds: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
        if (!expectedIds.every(id => optionIds.includes(id))) {
          errors.push({ field: `${path}.options`, message: 'Options must have IDs A, B, C, D' });
        }
      }
    });
  }

  // Validate landing page
  if (!data.landingPage) {
    errors.push({ field: 'landingPage', message: 'Landing page configuration is required' });
  } else {
    if (!data.landingPage.content?.scorecard_stats || 
        data.landingPage.content.scorecard_stats.length !== REQUIRED_SCORECARD_STATS) {
      errors.push({ 
        field: 'landingPage.content.scorecard_stats', 
        message: `Exactly ${REQUIRED_SCORECARD_STATS} scorecard stats are required` 
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

/**
 * Helper function to get expected pricing for certificate type and order
 */
const getPricingForCertificate = (type: string, order: number): { price: number; original: number } | null => {
  if (type === 'default' && order === 1) return PRICING_TIERS.default_1;
  if (type === 'default' && order === 2) return PRICING_TIERS.default_2;
  if (type === 'secondary' && order === 3) return PRICING_TIERS.secondary_1;
  if (type === 'secondary' && order === 4) return PRICING_TIERS.secondary_2;
  if (type === 'ai') return PRICING_TIERS.ai;
  return null;
};

/**
 * Checks if role name or slug already exists in database
 */
export const checkRoleExists = async (roleName: string, slug: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('id')
      .or(`role_name.eq.${roleName},slug.eq.${slug}`)
      .limit(1);

    if (error) {
      console.error('Error checking role existence:', error);
      return true; // Assume exists to prevent duplicates on error
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Exception checking role existence:', error);
    return true;
  }
};

/**
 * Inserts validated role data into database with transaction-like behavior
 */
export const insertRoleData = async (
  data: GeneratedRoleData,
  progressCallback?: InsertionProgressCallback
): Promise<RoleInsertionResult> => {
  const progress: InsertionProgress[] = [];
  
  const updateProgress = (step: InsertionProgress['step'], message: string, success: boolean, error?: string) => {
    const progressItem: InsertionProgress = { step, message, success, error };
    progress.push(progressItem);
    if (progressCallback) progressCallback(progressItem);
  };

  try {
    // Step 1: Insert Role
    updateProgress('role', 'Creating role...', false);
    
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .insert([{
        role_name: data.role.role_name,
        slug: data.role.slug,
        description: data.role.description,
        core_skill: data.role.core_skill,
        frameworks: data.role.frameworks,
        status: data.role.status
      }])
      .select('id')
      .single();

    if (roleError || !roleData) {
      updateProgress('role', 'Failed to create role', false, roleError?.message);
      return { success: false, error: roleError?.message || 'Failed to create role', progress };
    }

    const roleId = roleData.id;
    updateProgress('role', `Role created with ID: ${roleId}`, true);

    // Step 2: Insert Certificates
    updateProgress('certificates', 'Creating certificates...', false);
    
    const certificatesData = data.certificates.map(cert => ({
      role_id: roleId,
      name: cert.name,
      short_name: cert.short_name,
      cert_id_prefix: cert.cert_id_prefix,
      type: cert.type,
      order_index: cert.order_index,
      preview_image: cert.preview_image,
      description: cert.description,
      certificate_name: cert.certificate_name,
      price: cert.price,
      original_price: cert.original_price,
      badge: cert.badge,
      skill_frameworks: cert.skill_frameworks
    }));

    const { error: certificatesError } = await supabase
      .from('role_certificates')
      .insert(certificatesData);

    if (certificatesError) {
      updateProgress('certificates', 'Failed to create certificates', false, certificatesError.message);
      // Try to cleanup role
      await supabase.from('roles').delete().eq('id', roleId);
      return { success: false, error: certificatesError.message, progress };
    }

    updateProgress('certificates', `${data.certificates.length} certificates created`, true);

    // Step 3: Insert Assessment
    updateProgress('assessment', 'Creating assessment...', false);
    
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('assessments')
      .insert([{
        role_id: roleId,
        name: data.assessment.name,
        status: data.assessment.status
      }])
      .select('id')
      .single();

    if (assessmentError || !assessmentData) {
      updateProgress('assessment', 'Failed to create assessment', false, assessmentError?.message);
      return { success: false, error: assessmentError?.message || 'Failed to create assessment', progress };
    }

    const assessmentId = assessmentData.id;
    updateProgress('assessment', `Assessment created with ID: ${assessmentId}`, true);

    // Step 4: Insert Scenarios
    updateProgress('scenarios', 'Creating scenarios...', false);
    
    const scenariosData = data.scenarios.map(scenario => ({
      name: scenario.name,
      principle: scenario.principle,
      context: scenario.context,
      challenge: scenario.challenge,
      task: scenario.task,
      key_concepts: scenario.key_concepts,
      visual_model: scenario.visual_model,
      status: scenario.status,
      difficulty: scenario.difficulty,
      skill_name: scenario.skill_name,
      project_mandate: scenario.project_mandate,
      role_id: roleId
    }));

    const { data: insertedScenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .insert(scenariosData)
      .select('id');

    if (scenariosError || !insertedScenarios) {
      updateProgress('scenarios', 'Failed to create scenarios', false, scenariosError?.message);
      return { success: false, error: scenariosError?.message || 'Failed to create scenarios', progress };
    }

    updateProgress('scenarios', `${insertedScenarios.length} scenarios created`, true);

    // Step 5: Insert Questions
    updateProgress('questions', 'Creating questions...', false);
    
    const questionsData = data.questions.map(question => {
      const scenarioId = insertedScenarios[question.scenario_index]?.id;
      if (!scenarioId) {
        throw new Error(`Invalid scenario index: ${question.scenario_index}`);
      }
      
      return {
        scenario_id: scenarioId,
        question_text: question.question_text,
        options: question.options
      };
    });

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsData);

    if (questionsError) {
      updateProgress('questions', 'Failed to create questions', false, questionsError.message);
      return { success: false, error: questionsError.message, progress };
    }

    updateProgress('questions', `${questionsData.length} questions created`, true);

    // Step 6: Insert Assessment Phases
    updateProgress('phases', 'Creating assessment phases...', false);
    
    const phasesData = data.phases.map((phase, index) => ({
      assessment_id: assessmentId,
      order_index: phase.order_index,
      scenario_id: insertedScenarios[index]?.id,
      name: phase.name,
      description: phase.description
    }));

    const { error: phasesError } = await supabase
      .from('assessment_phases')
      .insert(phasesData);

    if (phasesError) {
      updateProgress('phases', 'Failed to create assessment phases', false, phasesError.message);
      return { success: false, error: phasesError.message, progress };
    }

    updateProgress('phases', `${phasesData.length} assessment phases created`, true);

    // Step 7: Insert Landing Page
    updateProgress('landing-page', 'Creating landing page...', false);
    
    const { error: landingPageError } = await supabase
      .from('role_landing_pages')
      .insert([{
        role_id: roleId,
        slug: data.landingPage.slug,
        hero_title: data.landingPage.hero_title,
        hero_description: data.landingPage.hero_description,
        content: data.landingPage.content,
        meta_title: data.landingPage.meta_title,
        meta_description: data.landingPage.meta_description,
        keywords: data.landingPage.keywords
      }]);

    if (landingPageError) {
      updateProgress('landing-page', 'Failed to create landing page', false, landingPageError.message);
      return { success: false, error: landingPageError.message, progress };
    }

    updateProgress('landing-page', 'Landing page created', true);
    updateProgress('completed', `Role "${data.role.role_name}" successfully created!`, true);

    return { 
      success: true, 
      role_id: roleId,
      progress 
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    updateProgress('completed', 'Role creation failed', false, errorMessage);
    return { success: false, error: errorMessage, progress };
  }
};

/**
 * Get all existing roles with basic statistics
 */
export const getAllRoles = async (): Promise<ExistingRole[]> => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        id,
        role_name,
        slug,
        status,
        created_at,
        role_certificates(count),
        scenarios(count),
        scenarios(questions(count))
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching roles:', error);
      return [];
    }

    return data.map(role => ({
      id: role.id,
      role_name: role.role_name,
      slug: role.slug,
      status: role.status,
      created_at: role.created_at,
      certificate_count: role.role_certificates?.length || 0,
      scenario_count: role.scenarios?.length || 0,
      question_count: role.scenarios?.reduce((total: number, scenario: any) => 
        total + (scenario.questions?.length || 0), 0) || 0
    }));
  } catch (error) {
    console.error('Exception fetching roles:', error);
    return [];
  }
};

/**
 * Delete role and all related data
 */
export const deleteRoleCompletely = async (roleId: number): Promise<RoleDeletionResult> => {
  try {
    let deletionResult: RoleDeletionResult = {
      success: false,
      deleted_components: {
        certificates: 0,
        scenarios: 0,
        questions: 0,
        phases: 0,
        landing_page: false,
        role: false
      }
    };

    // Get scenarios first to delete questions
    const { data: scenarios } = await supabase
      .from('scenarios')
      .select('id')
      .eq('role_id', roleId);

    if (scenarios && scenarios.length > 0) {
      const scenarioIds = scenarios.map(s => s.id);
      
      // Delete questions
      const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .in('scenario_id', scenarioIds);

      if (questionsError) {
        return { success: false, error: questionsError.message, deleted_components: deletionResult.deleted_components };
      }

      // Count deleted questions (approximate)
      deletionResult.deleted_components.questions = scenarios.length * 5; // Assuming 5 questions per scenario
    }

    // Delete certificates
    const { error: certificatesError } = await supabase
      .from('role_certificates')
      .delete()
      .eq('role_id', roleId);

    if (certificatesError) {
      return { success: false, error: certificatesError.message, deleted_components: deletionResult.deleted_components };
    }
    deletionResult.deleted_components.certificates = 5; // Standard certificate count

    // Delete assessment phases
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id')
      .eq('role_id', roleId);

    if (assessments && assessments.length > 0) {
      const { error: phasesError } = await supabase
        .from('assessment_phases')
        .delete()
        .eq('assessment_id', assessments[0].id);

      if (phasesError) {
        return { success: false, error: phasesError.message, deleted_components: deletionResult.deleted_components };
      }
      deletionResult.deleted_components.phases = 5; // Standard phase count
    }

    // Delete scenarios
    const { error: scenariosError } = await supabase
      .from('scenarios')
      .delete()
      .eq('role_id', roleId);

    if (scenariosError) {
      return { success: false, error: scenariosError.message, deleted_components: deletionResult.deleted_components };
    }
    deletionResult.deleted_components.scenarios = scenarios?.length || 0;

    // Delete assessments
    const { error: assessmentsError } = await supabase
      .from('assessments')
      .delete()
      .eq('role_id', roleId);

    if (assessmentsError) {
      return { success: false, error: assessmentsError.message, deleted_components: deletionResult.deleted_components };
    }

    // Delete landing page
    const { error: landingPageError } = await supabase
      .from('role_landing_pages')
      .delete()
      .eq('role_id', roleId);

    if (landingPageError) {
      return { success: false, error: landingPageError.message, deleted_components: deletionResult.deleted_components };
    }
    deletionResult.deleted_components.landing_page = true;

    // Finally, delete the role itself
    const { error: roleError } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (roleError) {
      return { success: false, error: roleError.message, deleted_components: deletionResult.deleted_components };
    }
    deletionResult.deleted_components.role = true;

    return { success: true, deleted_components: deletionResult.deleted_components };

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      deleted_components: {
        certificates: 0,
        scenarios: 0,
        questions: 0,
        phases: 0,
        landing_page: false,
        role: false
      }
    };
  }
};

/**
 * Get role statistics
 */
export const getRoleStats = async (): Promise<RoleStats> => {
  try {
    const [rolesResult, certificatesResult, scenariosResult, questionsResult] = await Promise.all([
      supabase.from('roles').select('status', { count: 'exact', head: true }),
      supabase.from('role_certificates').select('id', { count: 'exact', head: true }),
      supabase.from('scenarios').select('id', { count: 'exact', head: true }),
      supabase.from('questions').select('id', { count: 'exact', head: true })
    ]);

    const publishedRolesResult = await supabase
      .from('roles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');

    return {
      total_roles: rolesResult.count || 0,
      published_roles: publishedRolesResult.count || 0,
      total_certificates: certificatesResult.count || 0,
      total_scenarios: scenariosResult.count || 0,
      total_questions: questionsResult.count || 0
    };
  } catch (error) {
    console.error('Error fetching role stats:', error);
    return {
      total_roles: 0,
      published_roles: 0,
      total_certificates: 0,
      total_scenarios: 0,
      total_questions: 0
    };
  }
};