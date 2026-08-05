-- Reference schema. SQLAlchemy (db.py + models.py) creates these tables
-- automatically on startup -- you don't need to run this by hand unless
-- you want to inspect it or set up Postgres manually (e.g. on Neon/Supabase).

CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    filename VARCHAR NOT NULL,
    doc_type VARCHAR,
    provider VARCHAR,
    visit_date VARCHAR,
    raw_text TEXT,
    structured_json JSONB,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS medications (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    name_raw VARCHAR,
    name_normalized VARCHAR,
    rxcui VARCHAR,
    dosage VARCHAR,
    frequency VARCHAR,
    source_snippet TEXT
);

CREATE TABLE IF NOT EXISTS lab_results (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    test_name VARCHAR,
    value FLOAT,
    unit VARCHAR,
    reference_low FLOAT,
    reference_high FLOAT,
    source_snippet TEXT
);

-- Optional upgrade path: if you outgrow local numpy cosine similarity (rag.py),
-- enable pgvector on Neon/Supabase (free) and add:
-- CREATE EXTENSION IF NOT EXISTS vector;
-- ALTER TABLE documents ADD COLUMN embedding vector(384); -- matches all-MiniLM-L6-v2 dim
