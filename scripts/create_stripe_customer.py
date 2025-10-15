#!/usr/bin/env python3
"""
Stripe Customer Creation Script

This script connects to Stripe API and creates a new customer.
It uses the Stripe secret key from environment variables.

Usage:
    python scripts/create_stripe_customer.py

Requirements:
    pip install stripe python-dotenv
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'replace')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'replace')

# Add parent directory to path to import from project root
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables from .env.local
env_path = project_root / '.env.local'
load_dotenv(dotenv_path=env_path)

try:
    import stripe
except ImportError:
    print("❌ Error: stripe package not installed")
    print("Install it with: pip install stripe")
    sys.exit(1)


def get_stripe_key():
    """Get Stripe secret key from environment variables."""
    stripe_key = os.getenv('STRIPE_SECRET_KEY')

    if not stripe_key:
        print("❌ Error: STRIPE_SECRET_KEY not found in environment variables")
        print("Make sure .env.local file exists and contains STRIPE_SECRET_KEY")
        sys.exit(1)

    # Check if it's a test key
    if stripe_key.startswith('sk_test_'):
        print("✅ Using Stripe TEST mode")
    elif stripe_key.startswith('sk_live_'):
        print("⚠️  WARNING: Using Stripe LIVE mode!")
    else:
        print("⚠️  Warning: Unexpected Stripe key format")

    return stripe_key


def create_customer(email, name=None, description=None, metadata=None):
    """
    Create a new Stripe customer.

    Args:
        email (str): Customer email address (required)
        name (str): Customer full name (optional)
        description (str): Customer description (optional)
        metadata (dict): Additional metadata (optional)

    Returns:
        stripe.Customer: The created customer object
    """
    try:
        customer_data = {
            'email': email,
        }

        if name:
            customer_data['name'] = name

        if description:
            customer_data['description'] = description

        if metadata:
            customer_data['metadata'] = metadata

        print(f"\n📝 Creating customer with email: {email}")
        if name:
            print(f"   Name: {name}")

        customer = stripe.Customer.create(**customer_data)

        print(f"\n✅ Customer created successfully!")
        print(f"   Customer ID: {customer.id}")
        print(f"   Email: {customer.email}")
        if customer.name:
            print(f"   Name: {customer.name}")
        print(f"   Created: {customer.created}")

        return customer

    except stripe.error.StripeError as e:
        print(f"\n❌ Stripe API Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


def list_recent_customers(limit=5):
    """
    List recent Stripe customers.

    Args:
        limit (int): Number of customers to retrieve
    """
    try:
        print(f"\n📋 Retrieving last {limit} customers...")
        customers = stripe.Customer.list(limit=limit)

        if not customers.data:
            print("   No customers found")
            return

        print(f"\n✅ Found {len(customers.data)} customer(s):")
        for i, customer in enumerate(customers.data, 1):
            print(f"\n   {i}. Customer ID: {customer.id}")
            print(f"      Email: {customer.email}")
            if customer.name:
                print(f"      Name: {customer.name}")
            if customer.description:
                print(f"      Description: {customer.description}")

    except stripe.error.StripeError as e:
        print(f"\n❌ Stripe API Error: {e}")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")


def get_customer_by_email(email):
    """
    Search for a customer by email.

    Args:
        email (str): Email to search for

    Returns:
        stripe.Customer or None: The customer if found
    """
    try:
        print(f"\n🔍 Searching for customer with email: {email}")
        customers = stripe.Customer.list(email=email, limit=1)

        if customers.data:
            customer = customers.data[0]
            print(f"✅ Customer found!")
            print(f"   Customer ID: {customer.id}")
            print(f"   Email: {customer.email}")
            if customer.name:
                print(f"   Name: {customer.name}")
            return customer
        else:
            print(f"❌ No customer found with email: {email}")
            return None

    except stripe.error.StripeError as e:
        print(f"\n❌ Stripe API Error: {e}")
        return None


def interactive_mode():
    """Run in interactive mode to collect customer details."""
    print("\n" + "="*60)
    print("    Stripe Customer Creation - Interactive Mode")
    print("="*60)

    # Get email
    while True:
        email = input("\n📧 Customer email address: ").strip()
        if email and '@' in email:
            break
        print("   ⚠️  Please enter a valid email address")

    # Check if customer already exists
    existing = get_customer_by_email(email)
    if existing:
        proceed = input("\n⚠️  Customer already exists. Create another? (y/n): ").strip().lower()
        if proceed != 'y':
            print("❌ Cancelled")
            return

    # Get name
    name = input("\n👤 Customer name (optional, press Enter to skip): ").strip()
    if not name:
        name = None

    # Get description
    description = input("\n📝 Description (optional, press Enter to skip): ").strip()
    if not description:
        description = None

    # Get metadata
    add_metadata = input("\n🏷️  Add metadata? (y/n): ").strip().lower()
    metadata = {}

    if add_metadata == 'y':
        print("   Enter metadata key-value pairs (press Enter with empty key to finish):")
        while True:
            key = input("   Key: ").strip()
            if not key:
                break
            value = input("   Value: ").strip()
            metadata[key] = value

    if not metadata:
        metadata = None

    # Confirm creation
    print("\n" + "-"*60)
    print("📋 Customer details:")
    print(f"   Email: {email}")
    if name:
        print(f"   Name: {name}")
    if description:
        print(f"   Description: {description}")
    if metadata:
        print(f"   Metadata: {metadata}")
    print("-"*60)

    confirm = input("\n✅ Create this customer? (y/n): ").strip().lower()
    if confirm != 'y':
        print("❌ Cancelled")
        return

    # Create customer
    customer = create_customer(
        email=email,
        name=name,
        description=description,
        metadata=metadata
    )

    return customer


def main():
    """Main function."""
    print("\n🔷 Stripe Customer Creation Script")
    print("=" * 60)

    # Initialize Stripe
    stripe_key = get_stripe_key()
    stripe.api_key = stripe_key

    # Check if running with command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == '--list':
            # List recent customers
            limit = int(sys.argv[2]) if len(sys.argv) > 2 else 5
            list_recent_customers(limit)
        elif sys.argv[1] == '--search':
            # Search for customer by email
            if len(sys.argv) < 3:
                print("❌ Usage: python create_stripe_customer.py --search <email>")
                sys.exit(1)
            get_customer_by_email(sys.argv[2])
        elif sys.argv[1] == '--help':
            print("""
Usage:
    python scripts/create_stripe_customer.py                    # Interactive mode
    python scripts/create_stripe_customer.py --list [limit]     # List recent customers
    python scripts/create_stripe_customer.py --search <email>   # Search by email
    python scripts/create_stripe_customer.py --help             # Show this help

Examples:
    # Interactive mode (recommended for beginners)
    python scripts/create_stripe_customer.py

    # List last 10 customers
    python scripts/create_stripe_customer.py --list 10

    # Search for specific customer
    python scripts/create_stripe_customer.py --search john@example.com
""")
        else:
            # Quick create mode with email from command line
            email = sys.argv[1]
            name = sys.argv[2] if len(sys.argv) > 2 else None
            create_customer(email, name)
    else:
        # Interactive mode
        interactive_mode()

    print("\n" + "="*60)
    print("✅ Done!")
    print("="*60 + "\n")


if __name__ == '__main__':
    main()
