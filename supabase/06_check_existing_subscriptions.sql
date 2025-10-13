-- Check what tier values exist in the subscriptions table
SELECT DISTINCT tier, status, billing_period
FROM public.subscriptions
ORDER BY tier;
