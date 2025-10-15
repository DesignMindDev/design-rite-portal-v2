# Stripe Customer Creation Script - Summary

## ✅ What Was Created

I've created a complete Python script for managing Stripe customers in your Design-Rite Portal V2 project.

### Files Created:

1. **`scripts/create_stripe_customer.py`** (8.7KB)
   - Full-featured customer creation script
   - Interactive and command-line modes
   - Search and list functionality
   - Comprehensive error handling

2. **`scripts/requirements.txt`**
   - Python dependencies (stripe, python-dotenv)

3. **`scripts/README.md`** (9.1KB)
   - Complete documentation
   - Usage examples
   - Troubleshooting guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install stripe python-dotenv
```

### 2. Run Interactive Mode

```bash
python scripts/create_stripe_customer.py
```

### 3. Quick Create

```bash
python scripts/create_stripe_customer.py customer@example.com "Customer Name"
```

## 📋 Available Commands

### Interactive Mode (Recommended)
```bash
python scripts/create_stripe_customer.py
```
Walks you through creating a customer step-by-step.

### Quick Create
```bash
python scripts/create_stripe_customer.py email@example.com
python scripts/create_stripe_customer.py email@example.com "Full Name"
```

### List Recent Customers
```bash
python scripts/create_stripe_customer.py --list
python scripts/create_stripe_customer.py --list 10
```

### Search by Email
```bash
python scripts/create_stripe_customer.py --search email@example.com
```

### Help
```bash
python scripts/create_stripe_customer.py --help
```

## 🔑 Environment Variables

The script automatically loads from `.env.local`:
- **STRIPE_SECRET_KEY**: Your Stripe API key (already configured)

Current configuration:
- ✅ Test mode: `sk_test_51Rdsn800jf1eOeXQ...`
- ✅ Loads from `.env.local` automatically

## 🎯 Features

- ✅ **Interactive Mode**: User-friendly prompts
- ✅ **Quick Create**: Fast command-line creation
- ✅ **Duplicate Detection**: Warns if customer exists
- ✅ **Metadata Support**: Add custom key-value pairs
- ✅ **Search**: Find customers by email
- ✅ **List**: View recent customers
- ✅ **Test/Live Detection**: Shows which mode you're in
- ✅ **Auto-loads .env.local**: No manual configuration needed

## 📝 Example Usage

### Create a Customer Interactively

```bash
$ python scripts/create_stripe_customer.py

🔷 Stripe Customer Creation Script
============================================================
✅ Using Stripe TEST mode

============================================================
    Stripe Customer Creation - Interactive Mode
============================================================

📧 Customer email address: john@example.com
👤 Customer name (optional): John Doe
📝 Description (optional): Professional plan customer
🏷️  Add metadata? (y/n): y
   Key: company
   Value: ACME Corp
   Key: plan
   Value: professional
   Key:

✅ Create this customer? (y/n): y

✅ Customer created successfully!
   Customer ID: cus_ABcd1234EFgh5678
   Email: john@example.com
   Name: John Doe
```

### Quick Create

```bash
$ python scripts/create_stripe_customer.py jane@example.com "Jane Smith"

✅ Using Stripe TEST mode

✅ Customer created successfully!
   Customer ID: cus_XYz9876ABcd5432
   Email: jane@example.com
   Name: Jane Smith
```

## 🔧 Script Features

### Automatic Environment Loading
- Reads `.env.local` from project root
- No need to set environment variables manually

### Duplicate Detection
- Checks if email already exists
- Warns before creating duplicate
- Provides existing customer details

### Metadata Support
- Add custom data to customers
- Examples: company, plan, source, referral
- Searchable in Stripe Dashboard

### Error Handling
- Validates email format
- Catches Stripe API errors
- Provides helpful error messages
- Exits gracefully on errors

### Test/Live Mode Detection
- Shows which mode you're using
- `sk_test_` → Test mode
- `sk_live_` → Live mode
- Warns when using live mode

## 🔗 Integration with Portal V2

This script integrates with your existing setup:

1. **Supabase Profiles**: Create Stripe customers for portal users
2. **Subscription System**: Link customers to subscriptions
3. **Webhook Handler**: Works with existing webhook at `/api/stripe/webhook`
4. **Environment**: Uses same `.env.local` configuration

### Typical Workflow

1. User signs up → Supabase profile created
2. Run script → Stripe customer created
3. Store customer ID in `profiles` table
4. Create subscription → Attach to customer
5. Webhooks update → Sync status to Supabase

## 📦 Next Steps

### 1. Install Dependencies
```bash
pip install -r scripts/requirements.txt
```

### 2. Test the Script
```bash
python scripts/create_stripe_customer.py --list
```

### 3. Create a Test Customer
```bash
python scripts/create_stripe_customer.py test@design-rite.com "Test User"
```

### 4. Verify in Stripe Dashboard
https://dashboard.stripe.com/test/customers

## 🛠️ Extending the Script

The script can be extended with:

- **Subscription creation**
- **Payment method attachment**
- **Customer updates**
- **Batch customer import**
- **Supabase integration**

See `scripts/README.md` for code examples.

## 📚 Documentation

- **Full Guide**: `scripts/README.md`
- **Script Code**: `scripts/create_stripe_customer.py`
- **Dependencies**: `scripts/requirements.txt`

## 🔐 Security

- ✅ Uses test mode by default
- ✅ Never commits `.env.local`
- ✅ Loads credentials securely
- ✅ Validates API keys
- ✅ Comprehensive error handling

## ✅ Ready to Use!

Everything is set up and ready to go. Just run:

```bash
python scripts/create_stripe_customer.py
```

---

**Created**: 2025-10-14
**Python Version**: 3.13.3
**Stripe SDK**: Latest (>=8.0.0)
