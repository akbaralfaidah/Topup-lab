-- btrim without a character list removes spaces, but leaves tabs and line breaks.
DO $$
DECLARE target record;
BEGIN
  FOR target IN
    SELECT c.table_name, c.column_name FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.column_name IN ('idempotency_key', 'event_key')
      AND c.table_name IN ('membership_history', 'orders', 'order_status_history', 'payments',
        'payment_events', 'provider_events', 'ledger_entries', 'promo_usages',
        'flash_sale_reservations', 'referral_events', 'notifications')
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I',
      target.table_name, target.table_name || '_' || target.column_name || '_length');
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (length(%I) BETWEEN 1 AND 200 AND %I ~ %L)',
      target.table_name, target.table_name || '_' || target.column_name || '_length',
      target.column_name, target.column_name, '[^[:space:]]');
  END LOOP;
END;
$$;
