CREATE TABLE report_event_cursors(project_id uuid NOT NULL,run_id uuid NOT NULL,event_sequence bigint NOT NULL DEFAULT 0,PRIMARY KEY(project_id,run_id),FOREIGN KEY(run_id,project_id) REFERENCES scenario_runs(id,project_id));
ALTER TABLE scheduled_jobs ADD COLUMN desired_job jsonb;
ALTER TABLE sourcing_research ADD COLUMN lease_expires_at timestamptz;
