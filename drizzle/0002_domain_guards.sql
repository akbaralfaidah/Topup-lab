-- Financial corrections append new rows; ordinary DML cannot erase history.
CREATE FUNCTION public.topuplab_reject_history_mutation() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  RAISE EXCEPTION 'History mutation is not permitted on %', TG_TABLE_NAME USING ERRCODE = '23514';
END;
$$;
--> statement-breakpoint
CREATE FUNCTION public.topuplab_guard_immutable_columns() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
DECLARE allowed_columns text[] := string_to_array(TG_ARGV[0], ',');
BEGIN
  IF (to_jsonb(NEW) - allowed_columns) IS DISTINCT FROM (to_jsonb(OLD) - allowed_columns) THEN
    RAISE EXCEPTION 'Immutable terms cannot change on %', TG_TABLE_NAME USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION public.topuplab_guard_external_reference() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  IF (to_jsonb(OLD)->>TG_ARGV[0]) IS NOT NULL
    AND (to_jsonb(NEW)->>TG_ARGV[0]) IS DISTINCT FROM (to_jsonb(OLD)->>TG_ARGV[0]) THEN
    RAISE EXCEPTION 'External reference cannot be rewritten on %', TG_TABLE_NAME USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION public.topuplab_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DO $$
DECLARE current_table text;
BEGIN
  FOREACH current_table IN ARRAY ARRAY[
    'membership_history', 'product_input_schemas', 'provider_health',
    'price_snapshots', 'order_items', 'order_status_history', 'payment_events',
    'provider_events', 'ledger_entries', 'promo_usages', 'snapshot_promos',
    'referral_events', 'audit_logs', 'admin_notes'
  ] LOOP
    EXECUTE format('CREATE TRIGGER history_row_guard BEFORE UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.topuplab_reject_history_mutation()', current_table);
    EXECUTE format('CREATE TRIGGER history_truncate_guard BEFORE TRUNCATE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.topuplab_reject_history_mutation()', current_table);
  END LOOP;
END;
$$;
--> statement-breakpoint
DO $$
DECLARE spec record;
BEGIN
  FOR spec IN SELECT * FROM (VALUES
    ('orders', 'status,status_changed_at,updated_at'),
    ('payments', 'gateway_reference,status,paid_at,updated_at'),
    ('provider_attempts', 'provider_transaction_reference,status,submitted_at,last_checked_at,terminal_at,updated_at'),
    ('wallet_accounts', 'status,updated_at'),
    ('flash_sale_reservations', 'state,updated_at'),
    ('payment_event_processing', 'state,attempt_count,processed_at,error_code,updated_at'),
    ('provider_event_processing', 'state,attempt_count,processed_at,error_code,updated_at')
  ) AS policy(table_name, allowed_columns) LOOP
    EXECUTE format('CREATE TRIGGER immutable_terms_guard BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.topuplab_guard_immutable_columns(%L)', spec.table_name, spec.allowed_columns);
    EXECUTE format('CREATE TRIGGER preserve_row_guard BEFORE DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.topuplab_reject_history_mutation()', spec.table_name);
    EXECUTE format('CREATE TRIGGER preserve_truncate_guard BEFORE TRUNCATE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.topuplab_reject_history_mutation()', spec.table_name);
  END LOOP;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER payment_reference_guard BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.topuplab_guard_external_reference('gateway_reference');
--> statement-breakpoint
CREATE TRIGGER provider_reference_guard BEFORE UPDATE ON public.provider_attempts
FOR EACH ROW EXECUTE FUNCTION public.topuplab_guard_external_reference('provider_transaction_reference');
--> statement-breakpoint
DO $$
DECLARE current_table text;
BEGIN
  FOREACH current_table IN ARRAY ARRAY[
    'users', 'password_credentials', 'roles', 'membership_tiers', 'customer_profiles',
    'categories', 'brands', 'products', 'providers', 'provider_skus', 'provider_syncs',
    'pricing_rules', 'orders', 'payments', 'provider_attempts', 'wallet_accounts',
    'payment_event_processing', 'provider_event_processing', 'promos', 'flash_sales',
    'flash_sale_items', 'flash_sale_reservations', 'referral_codes', 'notifications',
    'cms_banners', 'system_settings'
  ] LOOP
    EXECUTE format('CREATE TRIGGER touch_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.topuplab_touch_updated_at()', current_table);
  END LOOP;
END;
$$;
--> statement-breakpoint
-- A blank key must never become a shared idempotency identity.
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
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (length(btrim(%I)) BETWEEN 1 AND 200)',
      target.table_name, target.table_name || '_' || target.column_name || '_length', target.column_name);
  END LOOP;
END;
$$;
