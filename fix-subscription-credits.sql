-- Fix subscription trigger functions to initialize credit fields
-- This ensures new users and existing users without subscriptions get their credits allocated

-- Function to automatically create free subscription for new users (with credits)
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a free subscription for new users with credit allocation
    INSERT INTO user_subscriptions (
      user_id,
      plan_id,
      payment_provider,
      amount_cents,
      currency,
      monthly_credits,
      credit_balance,
      overage_rate_cents,
      credit_rollover_days,
      overage_settings,
      status,
      current_period_start,
      current_period_end,
      customer_name,
      customer_phone,
      created_at,
      updated_at
    )
    SELECT
      NEW.id,
      sp.id,
      'flutterwave',
      0,
      'USD',
      COALESCE((sp.limits->>'monthlyCredits')::INTEGER, 0),
      COALESCE((sp.limits->>'monthlyCredits')::INTEGER, 0), -- Initialize with monthly credits
      COALESCE((sp.limits->>'overageRateCents')::INTEGER, 450),
      COALESCE((sp.limits->>'creditRolloverDays')::INTEGER, 0),
      '{"auto_reload": true, "manual_topup": false, "monthly_cap_cents": null}'::JSONB,
      'active',
      NOW(),
      NOW() + INTERVAL '1 year', -- Free users get 1 year
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      NOW(),
      NOW()
    FROM subscription_plans sp
    WHERE sp.price_cents = 0 AND sp.active = true
    LIMIT 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create free subscription for existing users who don't have one (with credits)
CREATE OR REPLACE FUNCTION public.create_free_subscription_for_existing_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    free_plan_id UUID;
    subscription_created BOOLEAN := FALSE;
BEGIN
    -- Check if user already has a subscription
    IF NOT EXISTS (
        SELECT 1 FROM user_subscriptions
        WHERE user_id = target_user_id
    ) THEN
        -- Create free subscription with credit allocation
        INSERT INTO user_subscriptions (
            user_id,
            plan_id,
            payment_provider,
            amount_cents,
            currency,
            monthly_credits,
            credit_balance,
            overage_rate_cents,
            credit_rollover_days,
            overage_settings,
            status,
            current_period_start,
            current_period_end,
            created_at,
            updated_at
        )
        SELECT
            target_user_id,
            sp.id,
            'flutterwave',
            0,
            'USD',
            COALESCE((sp.limits->>'monthlyCredits')::INTEGER, 0),
            COALESCE((sp.limits->>'monthlyCredits')::INTEGER, 0), -- Initialize with monthly credits
            COALESCE((sp.limits->>'overageRateCents')::INTEGER, 450),
            COALESCE((sp.limits->>'creditRolloverDays')::INTEGER, 0),
            '{"auto_reload": true, "manual_topup": false, "monthly_cap_cents": null}'::JSONB,
            'active',
            NOW(),
            NOW() + INTERVAL '1 year',
            NOW(),
            NOW()
        FROM subscription_plans sp
        WHERE sp.price_cents = 0 AND sp.active = true
        LIMIT 1;

        subscription_created := TRUE;
    END IF;

    RETURN subscription_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Subscription trigger functions updated to initialize credit fields';
END $$;
