import mixpanel from 'mixpanel-browser';
import { supabase } from './supabaseClient';
import { getStoredSessionId } from '../utils/localStorage';

// Mixpanel Token
const MIXPANEL_TOKEN = '1d7e2f8152407390f65bacaa422f2ea8';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Helper function to validate UUID
const isValidUUID = (uuid: string): boolean => {
    return UUID_REGEX.test(uuid);
};

/**
 * Check if session ID is valid (either numeric or UUID)
 * Since sessions table uses bigint auto-increment, session IDs can be numeric strings
 */
const isValidSessionId = (sessionId: string): boolean => {
    if (!sessionId || sessionId.trim() === '') return false;
    
    // Check if it's a valid UUID
    if (isValidUUID(sessionId)) return true;
    
    // Check if it's a valid numeric string (for bigint auto-increment IDs)
    const num = parseInt(sessionId, 10);
    return !isNaN(num) && num > 0 && num.toString() === sessionId.trim();
};

// Interface for queued events
interface QueuedEvent {
    eventName: string;
    properties: Record<string, any>;
    timestamp: number;
}

export class Analytics {
    private static instance: Analytics;
    private initialized: boolean = false;
    private sessionId: string | null = null;
    private eventQueue: QueuedEvent[] = [];
    private processingQueue: boolean = false;

    private constructor() {
        // Private constructor for singleton
    }

    public static getInstance(): Analytics {
        if (!Analytics.instance) {
            Analytics.instance = new Analytics();
        }
        return Analytics.instance;
    }

    /**
     * Get current session status for debugging
     */
    public getSessionStatus(): {
        sessionId: string | null;
        isValidUUID: boolean;
        initialized: boolean;
        queuedEvents: number;
    } {
        const sessionId = this.sessionId || getStoredSessionId();
        return {
            sessionId: sessionId ? sessionId.slice(0, 8) + '...' : null,
            isValidUUID: sessionId ? isValidUUID(sessionId) : false,
            initialized: this.initialized,
            queuedEvents: this.eventQueue.length
        };
    }

    /**
     * Initialize Mixpanel with the project token
     */
    public init() {
        if (this.initialized) return;

        try {
            mixpanel.init(MIXPANEL_TOKEN, {
                debug: import.meta.env.DEV, // Enable debug mode in development
                track_pageview: false, // We'll track page views manually for SPA
                persistence: 'localStorage',
                ignore_dnt: true, // Optional: Ignore Do Not Track browser settings if needed
                record_sessions_percent: 100,
                record_mask_text_selector: '', // Disable text masking
                record_mask_input_selector: '', // Disable input masking
                record_heatmap_data: true,
                record_console: true
            } as any);
            this.initialized = true;
            
            if (import.meta.env.DEV) {
                console.log('[Analytics] ✅ Mixpanel initialized successfully');
                console.log('[Analytics] Session Status:', this.getSessionStatus());
            }

            // Try to process any queued events after initialization
            this.processQueuedEvents();
        } catch (error) {
            console.error('[Analytics] ❌ Failed to initialize Mixpanel:', error);
        }
    }

    /**
     * Initialize/Create a Session in Supabase
     */
    public async initSession(_role?: string, _utmParams?: any) {
        // Try to get existing session
        let sid = getStoredSessionId();
        
        if (import.meta.env.DEV) {
            console.log('[Analytics] 🔍 Initializing session...', {
                storedSessionId: sid ? sid.slice(0, 8) + '...' : null,
                isValidUUID: sid ? isValidUUID(sid) : false,
                currentSessionId: this.sessionId ? this.sessionId.slice(0, 8) + '...' : null
            });
        }
        
        // If we have a local session ID but haven't set it in memory yet
        if (sid && !this.sessionId) {
            this.sessionId = sid;
            if (import.meta.env.DEV) {
                console.log('[Analytics] 📝 Set session ID from localStorage:', sid.slice(0, 8) + '...');
            }
            
            // Process any queued events now that we have a session
            this.processQueuedEvents();
        }

        if (this.sessionId) {
            if (import.meta.env.DEV) {
                console.log('[Analytics] ✅ Session initialized successfully');
            }
        } else {
            console.warn('[Analytics] ⚠️  No session ID available - events will be queued');
        }
    }

    /**
     * Manually set session ID and process queued events
     */
    public setSessionId(sessionId: string) {
        if (import.meta.env.DEV) {
            const fullSessionId = sessionId;
            console.log('[Analytics] 🔧 Setting session ID:', {
                sessionId: sessionId.length > 8 ? sessionId.slice(0, 8) + '...' : sessionId,
                fullSessionId: fullSessionId,
                length: sessionId.length,
                isValidSessionId: isValidSessionId(sessionId),
                isUUID: isValidUUID(sessionId),
                previousSessionId: this.sessionId ? this.sessionId.slice(0, 8) + '...' : null,
                queuedEvents: this.eventQueue.length
            });
            
            // Special warning for invalid session IDs
            if (!isValidSessionId(sessionId)) {
                console.error('[Analytics] 🚨 INVALID SESSION ID DETECTED!', {
                    sessionId: fullSessionId,
                    length: sessionId.length,
                    type: typeof sessionId,
                    suggestion: 'Check createSession API - should return a valid numeric or UUID string'
                });
            }
        }
        
        this.sessionId = sessionId;
        
        // Process any queued events only if we have a valid session ID
        if (this.eventQueue.length > 0 && isValidSessionId(sessionId)) {
            this.processQueuedEvents();
        }
    }

    /**
     * Process queued events when session becomes available
     */
    private async processQueuedEvents() {
        if (this.processingQueue || this.eventQueue.length === 0) {
            return;
        }

        const sessionId = this.sessionId || getStoredSessionId();
        if (!sessionId || !isValidUUID(sessionId)) {
            if (import.meta.env.DEV) {
                console.log('[Analytics] 📋 Cannot process queued events - no valid session ID');
            }
            return;
        }

        this.processingQueue = true;
        
        if (import.meta.env.DEV) {
            console.log(`[Analytics] 🔄 Processing ${this.eventQueue.length} queued events...`);
        }

        const eventsToProcess = [...this.eventQueue];
        this.eventQueue = [];

        for (const queuedEvent of eventsToProcess) {
            try {
                if (import.meta.env.DEV) {
                    console.log(`[Analytics] 📤 Processing queued event: ${queuedEvent.eventName}`);
                }
                
                // Add session info to properties
                const enrichedProperties = {
                    ...queuedEvent.properties,
                    session_id: sessionId,
                    queued_event: true,
                    original_timestamp: queuedEvent.timestamp
                };

                // Track to Mixpanel
                mixpanel.track(queuedEvent.eventName, enrichedProperties);
                
                // Track to Supabase
                await this.trackInSupabase(queuedEvent.eventName, enrichedProperties);
                
            } catch (error) {
                console.error(`[Analytics] ❌ Error processing queued event ${queuedEvent.eventName}:`, error);
                // Re-queue failed events (optional)
                // this.eventQueue.push(queuedEvent);
            }
        }

        this.processingQueue = false;
        
        if (import.meta.env.DEV) {
            console.log(`[Analytics] ✅ Finished processing queued events`);
        }
    }

    /**
     * Track an event with optional properties
     * @param eventName Name of the event
     * @param properties Additional properties for the event
     */
    public async track(eventName: string, properties: Record<string, any> = {}) {
        const sessionId = this.sessionId || getStoredSessionId();
        
        // Enhanced debug logging
        if (import.meta.env.DEV) {
            console.log(`[Analytics] 📊 Tracking event: ${eventName}`, {
                sessionId: sessionId ? sessionId.slice(0, 8) + '...' : 'none',
                sessionValid: sessionId ? isValidSessionId(sessionId) : false,
                isUUID: sessionId ? isValidUUID(sessionId) : false,
                initialized: this.initialized,
                properties: Object.keys(properties).length > 0 ? properties : 'none',
                queueLength: this.eventQueue.length
            });
        }

        if (!this.initialized) {
            // Attempt to init if not already (safeguard)
            console.log('[Analytics] 🚀 Auto-initializing analytics service...');
            this.init();
        }

        // Add session ID to properties if available
        const enrichedProps = { ...properties };
        if (sessionId) {
            enrichedProps.session_id = sessionId;
        }

        try {
            // Always track to Mixpanel (this works regardless of session)
            mixpanel.track(eventName, enrichedProps);
            
            if (import.meta.env.DEV) {
                console.log(`[Analytics] ✅ Mixpanel: ${eventName}`);
            }

            // Handle Supabase tracking based on session availability
            if (!sessionId) {
                // Queue event for later processing
                this.eventQueue.push({
                    eventName,
                    properties: enrichedProps,
                    timestamp: Date.now()
                });
                
                if (import.meta.env.DEV) {
                    console.log(`[Analytics] 📋 Queued event ${eventName} (no session available) - Queue size: ${this.eventQueue.length}`);
                }
                return;
            }

            if (!isValidSessionId(sessionId)) {
                if (import.meta.env.DEV) {
                    console.warn(`[Analytics] ⚠️  Invalid session ID format: ${sessionId} - Skipping Supabase tracking`);
                }
                return;
            }

            // Track to Supabase immediately
            await this.trackInSupabase(eventName, enrichedProps);

        } catch (error) {
            console.error(`[Analytics] ❌ Error tracking ${eventName}:`, error);
        }
    }

    private async trackInSupabase(eventName: string, properties: Record<string, any>) {
        try {
            // Ensure we have a session ID
            const sessionId = this.sessionId || getStoredSessionId();
            if (!sessionId) {
                if (import.meta.env.DEV) {
                    console.log(`[Analytics] 📋 No session ID for Supabase tracking: ${eventName}`);
                }
                return;
            }

            // Validate session ID format
            if (!isValidSessionId(sessionId)) {
                if (import.meta.env.DEV) {
                    console.warn(`[Analytics] ⚠️  Invalid session ID for Supabase: ${sessionId}`);
                }
                return;
            }

            // Retry logic for database insertions
            const maxRetries = 3;
            let attempt = 0;
            
            while (attempt < maxRetries) {
                try {
                    const { error } = await supabase
                        .from('tracking_events')
                        .insert({
                            session_id: sessionId,
                            event_name: eventName,
                            event_data: properties,
                            page_url: window.location.href,
                            created_at: new Date().toISOString()
                        });

                    if (error) {
                        if (attempt === maxRetries - 1) {
                            // Last attempt failed
                            console.error(`[Analytics] ❌ Supabase error after ${maxRetries} attempts:`, {
                                event: eventName,
                                error: error.message,
                                code: error.code,
                                sessionId: sessionId.slice(0, 8) + '...'
                            });
                        } else {
                            // Retry after a delay
                            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                            attempt++;
                            continue;
                        }
                    } else {
                        if (import.meta.env.DEV) {
                            console.log(`[Analytics] ✅ Supabase: ${eventName}${attempt > 0 ? ` (attempt ${attempt + 1})` : ''}`);
                        }
                        return; // Success
                    }
                    break;
                } catch (insertError) {
                    if (attempt === maxRetries - 1) {
                        throw insertError;
                    }
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                    attempt++;
                }
            }
            
        } catch (err) {
            console.error(`[Analytics] ❌ Exception in Supabase tracking for ${eventName}:`, err);
        }
    }

    /**
     * Identify a user by their unique ID
     * @param userId Unique user identifier (e.g., database ID or email if consistent)
     * @param traits Additional user traits
     */
    public identify(userId: string, traits: Record<string, any> = {}) {
        if (!this.initialized) return;
        try {
            mixpanel.identify(userId);
            if (Object.keys(traits).length > 0) {
                mixpanel.people.set(traits);
            }
            console.log(`[Analytics] Identified user: ${userId}`);

            // Update Supabase User Contact
            this.identifyInSupabase(userId, traits);
        } catch (error) {
            console.error('[Analytics] Error identifying user:', error);
        }
    }

    private async identifyInSupabase(email: string, traits: Record<string, any>) {
         try {
            const sessionId = this.sessionId || getStoredSessionId();

            if (!email) return;

            // Validate session ID if present
            if (sessionId && !isValidSessionId(sessionId)) {
                if (import.meta.env.DEV) {
                    console.warn('[Analytics] Invalid session ID for identify, skipping session link:', sessionId);
                }
            }

             // 1. Upsert User Contact
            // We use upsert to simplify the logic (insert or update)
            const { data: userData, error: userError } = await supabase
               .from('user_contacts')
               .upsert({
                   email: email,
                   name: traits.$name || traits.name,
                   phone: traits.$phone || traits.phone,
                   last_session_id: sessionId && isValidSessionId(sessionId) ? sessionId : null,
                   updated_at: new Date().toISOString()
               }, { onConflict: 'email' })
               .select('id') // We need the ID to link the session
               .single();

            if (userError) {
                console.error('[Analytics] Supabase identify error:', userError);
                return;
            }

            // 2. Link Session to User (with valid session ID - numeric or UUID)
            // Now that we know who this session belongs to, update the session record
            if (sessionId && userData?.id && isValidSessionId(sessionId)) {
                const { error: sessionError } = await supabase
                   .from('sessions')
                   .update({ user_id: userData.id })
                   .eq('id', sessionId);

                if (sessionError) {
                    console.warn('[Analytics] Failed to link session to user:', sessionError);
                } else {
                    console.log('[Analytics] Linked session', sessionId, 'to user', userData.id);
                }
            }

         } catch (err) {
             console.error('[Analytics] Supabase identify error:', err);
         }
    }

    /**
     * Set properties on the user's profile
     * @param properties User profile properties
     */
    public peopleSet(properties: Record<string, any>) {
        if (!this.initialized) return;
        try {
            mixpanel.people.set(properties);
            console.log('[Analytics] Set people properties:', properties);
            
            // If email is in properties, treat as identify
            if (properties.$email || properties.email) {
                this.identifyInSupabase(properties.$email || properties.email, properties);
            }
        } catch (error) {
            console.error('[Analytics] Error setting people properties:', error);
        }
    }

    /**
     * Register super properties to be sent with every event
     * @param properties Global properties
     */
    public register(properties: Record<string, any>) {
        if (!this.initialized) return;
        
        try {
            mixpanel.register(properties);
            
            if (properties.session_id) {
                const oldSessionId = this.sessionId;
                this.sessionId = properties.session_id;
                
                if (import.meta.env.DEV) {
                    console.log('[Analytics] 📝 Registered session ID:', {
                        newSessionId: properties.session_id.slice(0, 8) + '...',
                        oldSessionId: oldSessionId ? oldSessionId.slice(0, 8) + '...' : null,
                        isValidSessionId: isValidSessionId(properties.session_id),
                        isUUID: isValidUUID(properties.session_id),
                        queuedEvents: this.eventQueue.length
                    });
                }
                
                // Process any queued events now that we have a valid session
                if (this.eventQueue.length > 0) {
                    this.processQueuedEvents();
                }
            }
        } catch (error) {
            console.error('[Analytics] Error registering super properties:', error);
        }
    }

    /**
     * Clear the event queue (useful for testing)
     */
    public clearQueue() {
        const queueSize = this.eventQueue.length;
        this.eventQueue = [];
        if (import.meta.env.DEV) {
            console.log(`[Analytics] 🧹 Cleared ${queueSize} queued events`);
        }
    }

    /**
     * Get debug information about the analytics service
     */
    public getDebugInfo() {
        const sessionId = this.sessionId || getStoredSessionId();
        return {
            initialized: this.initialized,
            sessionId: sessionId ? sessionId.slice(0, 8) + '...' : null,
            fullSessionId: sessionId,
            isValidUUID: sessionId ? isValidUUID(sessionId) : false,
            queuedEvents: this.eventQueue.length,
            processingQueue: this.processingQueue,
            mixpanelInitialized: this.initialized
        };
    }
}

export const analytics = Analytics.getInstance();
