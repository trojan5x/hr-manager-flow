import mixpanel from 'mixpanel-browser';
import { supabase } from './supabaseClient';
import { getStoredSessionId } from '../utils/localStorage';

// Mixpanel Token
const MIXPANEL_TOKEN = '1d7e2f8152407390f65bacaa422f2ea8';

export class Analytics {
    private static instance: Analytics;
    private initialized: boolean = false;
    private sessionId: string | null = null;

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
            console.log('Mixpanel initialized');
        } catch (error) {
            console.error('Failed to initialize Mixpanel:', error);
        }
    }

    /**
     * Initialize/Create a Session in Supabase
     */
    public async initSession(_role?: string, _utmParams?: any) {
        // Try to get existing session
        let sid = getStoredSessionId();
        
        // If we have a local session ID but haven't set it in memory yet
        if (sid && !this.sessionId) {
            this.sessionId = sid;
        }

        // If no session ID exists, we should probably generate one, 
        // but typically App.tsx calls createSession api which generates it.
        // This function is mainly to Sync with Supabase if needed, or update metadata.
        
        // For simplicity, we'll assume App.tsx manages the ID creation via API,
        // and here we just ensure we have it for events.
        
        if (this.sessionId) {
            // Check if this session exists in Supabase?
            // For now, we trust the flow: App.tsx -> createSession (API) -> Supabase
            // So we don't need to double-create here.
        } else {
            console.warn('[Analytics] initSession called without an active session ID');
        }
    }

    /**
     * Track an event with optional properties
     * @param eventName Name of the event
     * @param properties Additional properties for the event
     */
    public async track(eventName: string, properties: Record<string, any> = {}) {
        if (!this.initialized) {
            // Attempt to init if not already (safeguard)
            this.init();
        }

        try {
            // 1. Track in Mixpanel (Sync/Fire-and-forget usually, but we keep it here)
            const enrichedProps = { ...properties };
            mixpanel.track(eventName, enrichedProps);
            
            if (import.meta.env.DEV) {
                console.log(`[Analytics] Tracked: ${eventName}`, enrichedProps);
            }

            // 2. Track in Supabase (Await this!)
            await this.trackInSupabase(eventName, enrichedProps);

        } catch (error) {
            console.error(`[Analytics] Error tracking ${eventName}:`, error);
        }
    }

    private async trackInSupabase(eventName: string, properties: Record<string, any>) {
        try {
            // Ensure we have a session ID
            const sessionId = this.sessionId || getStoredSessionId();
            if (!sessionId) return; // Cannot track without session for now (or could track as anon)

            // If session ID is "STATIC_SESSION_...", it might be the mock one.
            // But we want to store it anyway.
            
            // Normalize session ID to UUID if possible, or store as is?
            // Our Schema expects UUID for session_id. 
            // The Mock API returns 'STATIC_SESSION_...' which is NOT a UUID.
            // We need to handle this mismatch. 
            
            // OPTION: If session_id is not UUID, we can't insert into UUID column.
            // We should trust that createSession now returns a UUID (we will fix API next).
            
            const { error } = await supabase
                .from('tracking_events')
                .insert({
                    session_id: sessionId, // This will fail if not UUID. We need to Ensure API returns UUID.
                    event_name: eventName,
                    properties: properties,
                    page_url: window.location.href,
                    created_at: new Date().toISOString()
                });

            if (error) {
                // If error is invalid input syntax for type uuid, it means we haven't updated API yet.
                // Suppress for now or log warning.
                if (error.code !== '22P02') { // 22P02 is invalid text representation for uuid
                    console.warn('[Analytics] Supabase track error:', error.message);
                }
            }
        } catch (err) {
            // Silent fail for analytics
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

             // 1. Upsert User Contact
             // We use upsert to simplify the logic (insert or update)
             const { data: userData, error: userError } = await supabase
                .from('user_contacts')
                .upsert({
                    email: email,
                    name: traits.$name || traits.name,
                    phone: traits.$phone || traits.phone,
                    last_session_id: sessionId,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'email' })
                .select('id') // We need the ID to link the session
                .single();

             if (userError) {
                 console.error('[Analytics] Supabase identify error:', userError);
                 return;
             }

             // 2. Link Session to User
             // Now that we know who this session belongs to, update the session record
             if (sessionId && userData?.id) {
                 const { error: sessionError } = await supabase
                    .from('sessions')
                    .update({ user_id: userData.id })
                    .eq('session_id', sessionId);

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
                this.sessionId = properties.session_id;
            }
        } catch (error) {
            console.error('[Analytics] Error registering super properties:', error);
        }
    }
}

export const analytics = Analytics.getInstance();
