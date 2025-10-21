-- =====================================================
-- WORKSPACE FEATURE SUITE - Database Schema
-- =====================================================
-- Created: January 21, 2025
-- Purpose: Enterprise workspace for Professional/Enterprise subscribers
-- Features: Price books, templates, business docs, AI refinement,
--           e-signature, project management

-- =====================================================
-- 1. PRICE BOOKS
-- =====================================================
-- Supports CSV/Excel upload + manual entry
-- Professional: 1 price book, Enterprise: unlimited

CREATE TABLE IF NOT EXISTS price_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,  -- "2025 Q1 Pricing"
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('csv', 'excel', 'manual')),
  file_url TEXT,  -- Storage URL if uploaded
  is_active BOOLEAN DEFAULT false,  -- Only one active per user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price book line items (parsed from file or manually entered)
CREATE TABLE IF NOT EXISTS price_book_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_book_id UUID REFERENCES price_books(id) ON DELETE CASCADE,
  part_number TEXT,
  description TEXT NOT NULL,
  category TEXT,  -- "Cameras", "NVRs", "Access Control", "Labor"
  unit_price NUMERIC(10, 2) NOT NULL,
  unit TEXT DEFAULT 'ea',  -- "ea", "ft", "hr"
  vendor TEXT,
  manufacturer TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_price_book_items_category ON price_book_items(category);
CREATE INDEX IF NOT EXISTS idx_price_book_items_description ON price_book_items USING gin(to_tsvector('english', description));

-- RLS Policies for price_books
ALTER TABLE price_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own price books"
  ON price_books FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own price books"
  ON price_books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own price books"
  ON price_books FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own price books"
  ON price_books FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for price_book_items
ALTER TABLE price_book_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own price book items"
  ON price_book_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM price_books
      WHERE price_books.id = price_book_items.price_book_id
      AND price_books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own price book items"
  ON price_book_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM price_books
      WHERE price_books.id = price_book_items.price_book_id
      AND price_books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own price book items"
  ON price_book_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM price_books
      WHERE price_books.id = price_book_items.price_book_id
      AND price_books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own price book items"
  ON price_book_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM price_books
      WHERE price_books.id = price_book_items.price_book_id
      AND price_books.user_id = auth.uid()
    )
  );

-- =====================================================
-- 2. DOCUMENT TEMPLATES
-- =====================================================
-- DOCX templates with merge fields like {{client_name}}
-- Professional: 3 templates, Enterprise: unlimited

CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,  -- "Standard Proposal Template"
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('proposal', 'contract', 'sow', 'invoice', 'quote', 'other')),
  file_url TEXT,  -- DOCX file in storage
  merge_fields JSONB,  -- List of available merge fields: ["client_name", "total_price", ...]
  is_default BOOLEAN DEFAULT false,  -- Default template for this type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for document_templates
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
  ON document_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
  ON document_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON document_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON document_templates FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. BUSINESS DOCUMENTS
-- =====================================================
-- Insurance certs, W-9s, licenses, etc.
-- Attached to proposals automatically

CREATE TABLE IF NOT EXISTS business_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,  -- "General Liability Insurance"
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('insurance', 'certification', 'license', 'legal', 'tax', 'other')),
  file_url TEXT NOT NULL,  -- PDF in storage
  expiration_date TIMESTAMP WITH TIME ZONE,  -- For insurance/licenses
  auto_include BOOLEAN DEFAULT false,  -- Auto-attach to all proposals
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for business_documents
ALTER TABLE business_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business docs"
  ON business_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own business docs"
  ON business_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business docs"
  ON business_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own business docs"
  ON business_documents FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. PROJECTS (Main project tracking)
-- =====================================================
-- Tracks entire lifecycle: Draft → Signed → In Progress → Done

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Client & Project Info
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  project_name TEXT NOT NULL,
  project_description TEXT,

  -- Status & Priority
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',           -- Being created
    'ai_refining',     -- AI processing changes
    'review',          -- User reviewing AI output
    'ready_to_send',   -- Finalized, ready for client
    'sent',            -- Sent to client for signature
    'signed',          -- Client signed
    'in_progress',     -- Work in progress
    'completed',       -- Project done
    'cancelled'        -- Cancelled
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

  -- Dates
  deadline TIMESTAMP WITH TIME ZONE,
  date_sent TIMESTAMP WITH TIME ZONE,
  date_signed TIMESTAMP WITH TIME ZONE,
  date_completed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Document URLs
  original_proposal_url TEXT,      -- Initial proposal
  refined_proposal_url TEXT,       -- After AI refinement
  final_document_url TEXT,         -- Assembled final doc
  signed_document_url TEXT,        -- After client signature

  -- Financial
  estimated_value NUMERIC(12, 2),  -- Total project value

  -- Metadata
  notes TEXT
);

-- Index for sorting by deadline/priority
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status);

-- RLS Policies for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. CHANGE REQUESTS
-- =====================================================
-- Track client change requests (add/delete/move devices)

CREATE TABLE IF NOT EXISTS change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  request_text TEXT NOT NULL,  -- "Add 3 cameras to loading dock"
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ai_processing', 'completed', 'rejected')),
  ai_response TEXT,  -- AI's interpretation/confirmation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies for change_requests
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view change requests for own projects"
  ON change_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = change_requests.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create change requests for own projects"
  ON change_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = change_requests.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update change requests for own projects"
  ON change_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = change_requests.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- =====================================================
-- 6. SIGNATURE REQUESTS
-- =====================================================
-- Custom e-signature flow

CREATE TABLE IF NOT EXISTS signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Signer Info
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signer_title TEXT,  -- "Director of Operations"

  -- Document
  document_url TEXT NOT NULL,  -- PDF to be signed

  -- Signature
  signature_token TEXT UNIQUE NOT NULL,  -- Unique URL token for signing
  signature_data TEXT,  -- Base64 signature image or typed name
  signature_ip TEXT,     -- IP address of signer
  signed_at TIMESTAMP WITH TIME ZONE,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'viewed', 'signed', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),

  -- Tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for signature_requests
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signature requests for own projects"
  ON signature_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = signature_requests.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create signature requests for own projects"
  ON signature_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = signature_requests.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view signature request by token"
  ON signature_requests FOR SELECT
  USING (signature_token IS NOT NULL);

CREATE POLICY "Anyone can update signature by token"
  ON signature_requests FOR UPDATE
  USING (signature_token IS NOT NULL);

-- =====================================================
-- 7. PROJECT ATTACHMENTS
-- =====================================================
-- Link business docs to specific projects

CREATE TABLE IF NOT EXISTS project_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  business_document_id UUID REFERENCES business_documents(id) ON DELETE CASCADE,
  attached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, business_document_id)
);

-- RLS Policies for project_attachments
ALTER TABLE project_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments for own projects"
  ON project_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_attachments.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create attachments for own projects"
  ON project_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_attachments.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments for own projects"
  ON project_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_attachments.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- =====================================================
-- 8. ACTIVITY LOG (Audit trail)
-- =====================================================

CREATE TABLE IF NOT EXISTS workspace_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,  -- "created_project", "ai_refined", "sent_for_signature", "signed"
  description TEXT,
  metadata JSONB,  -- Flexible data storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for workspace_activity
ALTER TABLE workspace_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
  ON workspace_activity FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Workspace schema created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  • price_books + price_book_items';
  RAISE NOTICE '  • document_templates';
  RAISE NOTICE '  • business_documents';
  RAISE NOTICE '  • projects';
  RAISE NOTICE '  • change_requests';
  RAISE NOTICE '  • signature_requests';
  RAISE NOTICE '  • project_attachments';
  RAISE NOTICE '  • workspace_activity';
  RAISE NOTICE '';
  RAISE NOTICE 'All tables have RLS policies enabled.';
  RAISE NOTICE 'Ready for workspace feature implementation!';
END $$;
