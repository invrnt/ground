ALTER TABLE report_event_cursors ADD COLUMN last_report_id uuid REFERENCES report_snapshots;
