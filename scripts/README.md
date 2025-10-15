# Stripe Customer Management Scripts

Python scripts for managing Stripe customers in the Design-Rite Portal V2 project.

## Setup

### 1. Install Python Dependencies

```bash
cd scripts
pip install -r requirements.txt
```

Or install individually:
```bash
pip install stripe python-dotenv
```

### 2. Configure Environment Variables

The script automatically loads Stripe credentials from `.env.local` in the project root.

Required environment variable:
- `STRIPE_SECRET_KEY` - Your Stripe secret key (test or live mode)

## Usage

### Interactive Mode (Recommended)

Run the script without arguments to enter interactive mode:

```bash
python scripts/create_stripe_customer.py
```

You'll be prompted to enter:
- Customer email (required)
- Customer name (optional)
- Description (optional)
- Metadata (optional)

### Quick Create Mode

Create a customer with just an email:

```bash
python scripts/create_stripe_customer.py customer@example.com
```

Create with email and name:

```bash
python scripts/create_stripe_customer.py customer@example.com "John Doe"
```

### List Recent Customers

List the last 5 customers:

```bash
python scripts/create_stripe_customer.py --list
```

List the last 10 customers:

```bash
python scripts/create_stripe_customer.py --list 10
```

### Search for Customer by Email

```bash
python scripts/create_stripe_customer.py --search john@example.com
```

### Help

```bash
python scripts/create_stripe_customer.py --help
```

## Examples

### Example 1: Create Customer Interactively

```bash
$ python scripts/create_stripe_customer.py

🔷 Stripe Customer Creation Script
============================================================
✅ Using Stripe TEST mode

============================================================
    Stripe Customer Creation - Interactive Mode
============================================================

📧 Customer email address: john@example.com

🔍 Searching for customer with email: john@example.com
❌ No customer found with email: john@example.com

👤 Customer name (optional, press Enter to skip): John Doe

📝 Description (optional, press Enter to skip): Test customer for Design-Rite Portal

🏷️  Add metadata? (y/n): y
   Enter metadata key-value pairs (press Enter with empty key to finish):
   Key: company
   Value: ACME Corp
   Key: plan
   Value: professional
   Key:

------------------------------------------------------------
📋 Customer details:
   Email: john@example.com
   Name: John Doe
   Description: Test customer for Design-Rite Portal
   Metadata: {'company': 'ACME Corp', 'plan': 'professional'}
------------------------------------------------------------

✅ Create this customer? (y/n): y

📝 Creating customer with email: john@example.com
   Name: John Doe

✅ Customer created successfully!
   Customer ID: cus_ABcd1234EFgh5678
   Email: john@example.com
   Name: John Doe
   Created: 1728936000

============================================================
✅ Done!
============================================================
```

### Example 2: Quick Create

```bash
$ python scripts/create_stripe_customer.py jane@example.com "Jane Smith"

🔷 Stripe Customer Creation Script
============================================================
✅ Using Stripe TEST mode

📝 Creating customer with email: jane@example.com
   Name: Jane Smith

✅ Customer created successfully!
   Customer ID: cus_XYz9876ABcd5432
   Email: jane@example.com
   Name: Jane Smith
   Created: 1728936100

============================================================
✅ Done!
============================================================
```

### Example 3: List Recent Customers

```bash
$ python scripts/create_stripe_customer.py --list 3

🔷 Stripe Customer Creation Script
============================================================
✅ Using Stripe TEST mode

📋 Retrieving last 3 customers...

✅ Found 3 customer(s):

   1. Customer ID: cus_XYz9876ABcd5432
      Email: jane@example.com
      Name: Jane Smith

   2. Customer ID: cus_ABcd1234EFgh5678
      Email: john@example.com
      Name: John Doe
      Description: Test customer for Design-Rite Portal

   3. Customer ID: cus_Test1234567890
      Email: test@design-rite.com
      Name: Test User

============================================================
✅ Done!
============================================================
```

### Example 4: Search for Customer

```bash
$ python scripts/create_stripe_customer.py --search john@example.com

🔷 Stripe Customer Creation Script
============================================================
✅ Using Stripe TEST mode

🔍 Searching for customer with email: john@example.com
✅ Customer found!
   Customer ID: cus_ABcd1234EFgh5678
   Email: john@example.com
   Name: John Doe

============================================================
✅ Done!
============================================================
```

## Features

- ✅ **Interactive Mode**: Step-by-step customer creation
- ✅ **Quick Create**: Fast customer creation from command line
- ✅ **Duplicate Detection**: Warns if customer already exists
- ✅ **Metadata Support**: Add custom metadata to customers
- ✅ **Search**: Find customers by email
- ✅ **List**: View recent customers
- ✅ **Test/Live Mode Detection**: Clearly indicates which Stripe mode is active
- ✅ **Error Handling**: Comprehensive error messages
- ✅ **Environment Variable Loading**: Automatic .env.local loading

## Customer Metadata Examples

You can add custom metadata to track additional information:

```python
metadata = {
    'company': 'ACME Corp',
    'plan': 'professional',
    'source': 'website',
    'referral': 'google_ads',
    'trial_end': '2025-11-14',
    'industry': 'security'
}
```

This metadata is searchable in Stripe dashboard and accessible via API.

## Integration with Design-Rite Portal

This script is designed to work with the Design-Rite Portal V2 subscription system:

1. **Customer Creation**: Creates Stripe customers for portal users
2. **Metadata Tracking**: Stores user role, company, and subscription details
3. **Subscription Plans**: Can be extended to create subscriptions
4. **Webhook Integration**: Works with existing webhook handlers

### Typical Workflow

1. User signs up in portal → Creates Supabase profile
2. Run this script → Creates Stripe customer
3. Link customer ID → Store in Supabase `profiles` table
4. Create subscription → Attach to customer
5. Webhook updates → Sync subscription status to Supabase

## Extending the Script

### Add Subscription Creation

```python
def create_subscription(customer_id, price_id):
    """Create a subscription for a customer."""
    subscription = stripe.Subscription.create(
        customer=customer_id,
        items=[{'price': price_id}],
        payment_behavior='default_incomplete',
        expand=['latest_invoice.payment_intent']
    )
    return subscription
```

### Add Payment Method

```python
def add_payment_method(customer_id, payment_method_id):
    """Attach a payment method to a customer."""
    stripe.PaymentMethod.attach(
        payment_method_id,
        customer=customer_id
    )
    stripe.Customer.modify(
        customer_id,
        invoice_settings={'default_payment_method': payment_method_id}
    )
```

### Update Customer

```python
def update_customer(customer_id, **kwargs):
    """Update customer details."""
    return stripe.Customer.modify(customer_id, **kwargs)
```

## Troubleshooting

### "stripe package not installed"

Install the Stripe Python library:
```bash
pip install stripe
```

### "STRIPE_SECRET_KEY not found"

Make sure `.env.local` exists in the project root and contains:
```
STRIPE_SECRET_KEY=sk_test_your_key_here
```

### "Invalid API Key"

- Check that your API key is correct
- Verify it starts with `sk_test_` (test mode) or `sk_live_` (live mode)
- Generate a new key in Stripe Dashboard if needed

### "Customer already exists"

The email address is already used by another customer. Use:
- Different email address
- `--search` to find existing customer
- Stripe dashboard to manage existing customer

## Security Notes

- Never commit `.env.local` or expose API keys
- Use test mode (`sk_test_`) for development
- Rotate API keys periodically
- Use restricted keys when possible
- Monitor API usage in Stripe Dashboard

## Related Files

- `../src/app/api/stripe/webhook/route.ts` - Stripe webhook handler
- `../.env.local` - Environment variables (not committed)
- `../package.json` - Stripe.js dependencies
- `../CLAUDE.md` - Project documentation

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Python Library](https://github.com/stripe/stripe-python)
- [Stripe Customer Object](https://stripe.com/docs/api/customers)
- [Stripe Dashboard](https://dashboard.stripe.com)

---

**Created**: 2025-10-14
**For**: Design-Rite Portal V2
**By**: Claude Code
