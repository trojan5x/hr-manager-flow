-- Create table for storing AI-generated assessment insights
CREATE TABLE IF NOT EXISTS assessment_insights (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    strengths JSONB NOT NULL,
    weaknesses JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_model TEXT DEFAULT 'gemini-1.5-flash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_assessment_insights_session_id ON assessment_insights(session_id);

-- Add RLS policies
ALTER TABLE assessment_insights ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role to manage insights
CREATE POLICY "Service role can manage assessment insights" ON assessment_insights
    FOR ALL USING (auth.role() = 'service_role');

-- Policy to allow authenticated users to read their own insights
CREATE POLICY "Users can read their own assessment insights" ON assessment_insights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions 
            WHERE sessions.id::text = assessment_insights.session_id 
            AND sessions.user_id = auth.uid()::bigint
        )
    );