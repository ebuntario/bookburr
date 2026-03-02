-- Session shapes: add session_shape, date_range, dates_locked to bukber_sessions

ALTER TABLE bukber_sessions
    ADD COLUMN session_shape text NOT NULL DEFAULT 'need_both',
    ADD COLUMN date_range_start date,
    ADD COLUMN date_range_end date,
    ADD COLUMN dates_locked boolean NOT NULL DEFAULT false;

ALTER TABLE bukber_sessions
    ADD CONSTRAINT chk_session_shape CHECK (session_shape IN ('need_both', 'date_known', 'venue_known'));
