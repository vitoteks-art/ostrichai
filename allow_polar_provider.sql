-- Rename the old constraint (or drop it) and create a new one, OR alter the type if it's an ENUM.
-- Assuming it's a CHECK constraint based on the error message: "payment_transactions_payment_provider_check"

-- First, drop the existing constraint
ALTER TABLE "public"."payment_transactions" DROP CONSTRAINT IF EXISTS "payment_transactions_payment_provider_check";

-- Re-add the constraint with 'polar' included
ALTER TABLE "public"."payment_transactions" 
  ADD CONSTRAINT "payment_transactions_payment_provider_check" 
  CHECK (provider IN ('flutterwave', 'paystack', 'polar', 'admin'));

-- Also check if there is a subscription provider constraint? 
-- The user didn't report one, but good to be safe.
-- Inspecting subscriptionService.ts suggests 'polar' is passed there too.
-- Let's just fix the reported one first.
