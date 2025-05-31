-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    initiator VARCHAR(255) NOT NULL,
    total_participants INTEGER NOT NULL,
    current_participants INTEGER DEFAULT 0,
    contribution_amount DECIMAL NOT NULL,
    max_members INTEGER NOT NULL,
    members TEXT[] DEFAULT '{}',
    contributions JSONB DEFAULT '[]',
    frequency VARCHAR(10) CHECK (frequency IN ('Monthly', 'Weekly', 'Daily')) DEFAULT 'Monthly',
    duration INTEGER NOT NULL,
    total_amount DECIMAL NOT NULL,
    status VARCHAR(10) CHECK (status IN ('Open', 'Closed', 'Completed')) DEFAULT 'Open',
    trust_score_required INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    allow_partial BOOLEAN DEFAULT false,
    contract_address VARCHAR(255),
    contract_tx_hash VARCHAR(255)
); 