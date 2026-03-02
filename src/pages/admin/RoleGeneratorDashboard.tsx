import React, { useState, useEffect, useCallback } from 'react';
import { generateRolePrompt, copyToClipboard, validateJSON } from '../../utils/promptTemplate';
import { validateRoleName, createValidationReport } from '../../utils/validationUtils';
import {
  insertRoleData,
  deleteRoleCompletely,
  getAllRoles,
  getRoleStats,
  checkRoleExists
} from '../../services/roleService';
import type {
  GeneratedRoleData,
  InsertionProgress,
  ExistingRole,
  RoleStats,
  RoleGeneratorFormState
} from '../../types/roleGeneration';
import TopBar from '../../components/TopBar';
import ErrorBoundary from '../../components/ErrorBoundary';

const RoleGeneratorDashboard: React.FC = () => {
  const [formState, setFormState] = useState<RoleGeneratorFormState>({
    roleName: '',
    isGeneratingPrompt: false,
    generatedPrompt: '',
    jsonInput: '',
    isValidatingJson: false,
    validationResult: null,
    isInsertingData: false,
    insertionProgress: [],
    lastInsertionResult: null
  });

  const [existingRoles, setExistingRoles] = useState<ExistingRole[]>([]);
  const [roleStats, setRoleStats] = useState<RoleStats>({
    total_roles: 0,
    published_roles: 0,
    total_certificates: 0,
    total_scenarios: 0,
    total_questions: 0
  });
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isDeletingRole, setIsDeletingRole] = useState<number | null>(null);
  const [roleNameValidation, setRoleNameValidation] = useState<{ isValid: boolean; error?: string } | null>(null);

  // Load existing roles and stats
  const loadRolesAndStats = useCallback(async () => {
    setIsLoadingRoles(true);
    try {
      const [roles, stats] = await Promise.all([
        getAllRoles(),
        getRoleStats()
      ]);
      setExistingRoles(roles);
      setRoleStats(stats);
    } catch (error) {
      console.error('Error loading roles and stats:', error);
      alert('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setIsLoadingRoles(false);
    }
  }, []);

  // Validate role name on change
  const handleRoleNameChange = useCallback((value: string) => {
    setFormState(prev => ({ ...prev, roleName: value }));
    
    if (value.trim()) {
      const validation = validateRoleName(value);
      setRoleNameValidation(validation);
    } else {
      setRoleNameValidation(null);
    }
  }, []);

  useEffect(() => {
    loadRolesAndStats();
  }, [loadRolesAndStats]);

  // Generate AI prompt
  const handleGeneratePrompt = useCallback(async () => {
    if (!formState.roleName.trim()) {
      alert('Please enter a role name first');
      return;
    }

    setFormState(prev => ({ ...prev, isGeneratingPrompt: true }));

    try {
      const prompt = generateRolePrompt(formState.roleName.trim());
      setFormState(prev => ({
        ...prev,
        generatedPrompt: prompt,
        isGeneratingPrompt: false
      }));
    } catch (error) {
      console.error('Error generating prompt:', error);
      setFormState(prev => ({ ...prev, isGeneratingPrompt: false }));
      alert('Failed to generate prompt');
    }
  }, [formState.roleName]);

  // Copy prompt to clipboard
  const handleCopyPrompt = useCallback(async () => {
    const success = await copyToClipboard(formState.generatedPrompt);
    if (success) {
      alert('Prompt copied to clipboard!');
    } else {
      alert('Failed to copy prompt');
    }
  }, [formState.generatedPrompt]);

  // Validate JSON input
  const handleValidateJson = useCallback(async () => {
    if (!formState.jsonInput.trim()) {
      alert('Please paste the AI-generated JSON first');
      return;
    }

    setFormState(prev => ({ ...prev, isValidatingJson: true }));

    try {
      // First validate JSON format and size
      const jsonValidation = validateJSON(formState.jsonInput);
      if (!jsonValidation.isValid) {
        setFormState(prev => ({
          ...prev,
          validationResult: {
            isValid: false,
            errors: [{ field: 'json', message: jsonValidation.error || 'Invalid JSON format' }]
          },
          isValidatingJson: false
        }));
        return;
      }

      // Create comprehensive validation report
      const validationReport = createValidationReport(jsonValidation.data as GeneratedRoleData);
      
      // Check if role already exists
      if (validationReport.isValid) {
        const data = jsonValidation.data as GeneratedRoleData;
        const exists = await checkRoleExists(data.role.role_name, data.role.slug);
        if (exists) {
          validationReport.errors.push({
            field: 'role',
            message: 'A role with this name or slug already exists'
          });
          validationReport.isValid = false;
        }
      }

      setFormState(prev => ({
        ...prev,
        validationResult: {
          isValid: validationReport.isValid,
          errors: validationReport.errors,
          warnings: validationReport.warnings
        },
        isValidatingJson: false
      }));

    } catch (error) {
      console.error('Error validating JSON:', error);
      setFormState(prev => ({
        ...prev,
        validationResult: {
          isValid: false,
          errors: [{ field: 'validation', message: 'Validation process failed: ' + (error instanceof Error ? error.message : 'Unknown error') }]
        },
        isValidatingJson: false
      }));
    }
  }, [formState.jsonInput]);

  // Progress callback for insertion
  const handleInsertionProgress = useCallback((progress: InsertionProgress) => {
    setFormState(prev => ({
      ...prev,
      insertionProgress: [...prev.insertionProgress, progress]
    }));
  }, []);

  // Insert role data
  const handleInsertData = useCallback(async () => {
    if (!formState.validationResult?.isValid) {
      alert('Please validate the JSON data first');
      return;
    }

    const jsonValidation = validateJSON(formState.jsonInput);
    if (!jsonValidation.isValid) {
      alert('Invalid JSON data');
      return;
    }

    setFormState(prev => ({
      ...prev,
      isInsertingData: true,
      insertionProgress: [],
      lastInsertionResult: null
    }));

    try {
      const result = await insertRoleData(
        jsonValidation.data as GeneratedRoleData,
        handleInsertionProgress
      );

      setFormState(prev => ({
        ...prev,
        lastInsertionResult: result,
        isInsertingData: false
      }));

      if (result.success) {
        // Reload roles and stats
        await loadRolesAndStats();
        
        // Clear form on success
        setFormState(prev => ({
          ...prev,
          roleName: '',
          generatedPrompt: '',
          jsonInput: '',
          validationResult: null
        }));

        alert('Role created successfully!');
      } else {
        alert(`Failed to create role: ${result.error}`);
      }

    } catch (error) {
      console.error('Error inserting role data:', error);
      setFormState(prev => ({
        ...prev,
        isInsertingData: false,
        lastInsertionResult: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }));
      alert('Failed to create role');
    }
  }, [formState.validationResult, formState.jsonInput, handleInsertionProgress, loadRolesAndStats]);

  // Delete role
  const handleDeleteRole = useCallback(async (roleId: number, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}" and all its data? This action cannot be undone.`)) {
      return;
    }

    setIsDeletingRole(roleId);

    try {
      const result = await deleteRoleCompletely(roleId);
      
      if (result.success) {
        await loadRolesAndStats();
        alert(`Role "${roleName}" deleted successfully`);
      } else {
        alert(`Failed to delete role: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Failed to delete role');
    } finally {
      setIsDeletingRole(null);
    }
  }, [loadRolesAndStats]);

  return (
    <div className="min-h-screen font-sans text-white" style={{ background: 'radial-gradient(50% 50% at 50% 50%, #00385C 0%, #001C2C 100%)' }}>
      <TopBar>
        <div className="text-xl font-bold flex items-center gap-2">
          <span className="text-[#98D048]">Role</span> Generator Dashboard
        </div>
      </TopBar>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            <a
              href="/admin/certificates"
              className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-300 hover:text-white hover:border-gray-300 transition-colors"
            >
              Certificates
            </a>
            <a
              href="/admin/role-generator"
              className="py-4 px-1 border-b-2 border-[#98D048] font-medium text-sm text-[#98D048]"
            >
              Role Generator
            </a>
            <a
              href="/admin/dashboard"
              className="py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-300 hover:text-white hover:border-gray-300 transition-colors"
            >
              Analytics
            </a>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#98D048]">{roleStats.total_roles}</p>
              <p className="text-sm text-gray-400">Total Roles</p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{roleStats.published_roles}</p>
              <p className="text-sm text-gray-400">Published</p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{roleStats.total_certificates}</p>
              <p className="text-sm text-gray-400">Certificates</p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{roleStats.total_scenarios}</p>
              <p className="text-sm text-gray-400">Scenarios</p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-pink-400">{roleStats.total_questions}</p>
              <p className="text-sm text-gray-400">Questions</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Role Generator */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Generate AI Prompt */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 text-white">Step 1: Generate AI Prompt</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Role Name</label>
                  <input
                    type="text"
                    value={formState.roleName}
                    onChange={(e) => handleRoleNameChange(e.target.value)}
                    placeholder="e.g. Data Scientist"
                    className={`w-full px-4 py-2 bg-white/10 border rounded-lg focus:outline-none text-white ${
                      roleNameValidation?.isValid === false 
                        ? 'border-red-500 focus:border-red-400' 
                        : 'border-white/20 focus:border-[#98D048]'
                    }`}
                  />
                  {roleNameValidation?.isValid === false && (
                    <p className="mt-1 text-sm text-red-400">{roleNameValidation.error}</p>
                  )}
                  {roleNameValidation?.isValid === true && (
                    <p className="mt-1 text-sm text-green-400">✓ Valid role name</p>
                  )}
                </div>

                <button
                  onClick={handleGeneratePrompt}
                  disabled={formState.isGeneratingPrompt || !formState.roleName.trim() || roleNameValidation?.isValid === false}
                  className="w-full py-2 px-4 bg-[#98D048] text-[#021019] rounded-lg font-bold hover:bg-[#98D048]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formState.isGeneratingPrompt ? 'Generating...' : 'Generate AI Prompt'}
                </button>

                {formState.generatedPrompt && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-300">Generated Prompt</label>
                      <button
                        onClick={handleCopyPrompt}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-sm text-white rounded transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy
                      </button>
                    </div>
                    <textarea
                      value={formState.generatedPrompt}
                      readOnly
                      className="w-full h-32 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-mono resize-none"
                    />
                    <p className="text-sm text-gray-400">
                      Copy this prompt and paste it into your AI tool (ChatGPT, Claude, etc.)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: JSON Input */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 text-white">Step 2: Paste AI Response</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">AI Generated JSON</label>
                  <textarea
                    value={formState.jsonInput}
                    onChange={(e) => setFormState(prev => ({ ...prev, jsonInput: e.target.value }))}
                    placeholder="Paste the complete JSON response from AI here..."
                    className="w-full h-64 px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-[#98D048] text-white text-sm font-mono resize-none"
                  />
                </div>

                <button
                  onClick={handleValidateJson}
                  disabled={formState.isValidatingJson || !formState.jsonInput.trim()}
                  className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formState.isValidatingJson ? 'Validating...' : 'Validate JSON'}
                </button>

                {/* Validation Results */}
                {formState.validationResult && (
                  <div className={`p-4 rounded-lg ${formState.validationResult.isValid ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {formState.validationResult.isValid ? (
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={`font-bold ${formState.validationResult.isValid ? 'text-green-400' : 'text-red-400'}`}>
                        {formState.validationResult.isValid ? 'Validation Passed' : 'Validation Failed'}
                      </span>
                    </div>
                    
                    {formState.validationResult.errors.length > 0 && (
                      <div className="space-y-1">
                        {formState.validationResult.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-300">
                            <span className="font-medium">{error.field}:</span> {error.message}
                          </p>
                        ))}
                      </div>
                    )}

                    {formState.validationResult.warnings && formState.validationResult.warnings.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium text-yellow-400">Warnings:</p>
                        {formState.validationResult.warnings.map((warning, index) => (
                          <p key={index} className="text-sm text-yellow-300">• {warning}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Insert Data */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4 text-white">Step 3: Create Role</h2>
              
              <div className="space-y-4">
                <button
                  onClick={handleInsertData}
                  disabled={formState.isInsertingData || !formState.validationResult?.isValid}
                  className="w-full py-3 px-4 bg-[#98D048] text-[#021019] rounded-lg font-bold hover:bg-[#98D048]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formState.isInsertingData ? 'Creating Role...' : 'Create Role in Database'}
                </button>

                {/* Insertion Progress */}
                {formState.insertionProgress.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">Progress:</p>
                    <div className="space-y-1">
                      {formState.insertionProgress.map((progress, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {progress.success ? (
                            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : progress.error ? (
                            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          ) : (
                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                          )}
                          <span className={progress.success ? 'text-green-300' : progress.error ? 'text-red-300' : 'text-blue-300'}>
                            {progress.message}
                          </span>
                          {progress.error && (
                            <span className="text-red-400 text-xs">({progress.error})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Existing Roles */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 sticky top-24">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Existing Roles</h2>
                <button
                  onClick={loadRolesAndStats}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Refresh"
                >
                  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {isLoadingRoles ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#98D048] mx-auto"></div>
                  <p className="text-sm text-gray-400 mt-2">Loading roles...</p>
                </div>
              ) : existingRoles.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No roles created yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {existingRoles.map((role) => (
                    <div key={role.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{role.role_name}</h3>
                          <p className="text-xs text-gray-400 truncate">{role.slug}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 text-xs rounded ${role.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {role.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {role.certificate_count}c • {role.scenario_count}s • {role.question_count}q
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRole(role.id, role.role_name)}
                          disabled={isDeletingRole === role.id}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
                          title="Delete Role"
                        >
                          {isDeletingRole === role.id ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function RoleGeneratorDashboardWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <RoleGeneratorDashboard />
    </ErrorBoundary>
  );
}