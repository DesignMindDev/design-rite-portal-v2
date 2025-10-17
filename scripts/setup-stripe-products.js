/**
 * Stripe Product Setup Script
 * Creates Design-Rite subscription products with 7-day trials
 *
 * Usage: node scripts/setup-stripe-products.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createProducts() {
  console.log('🚀 Setting up Stripe products...\n');

  try {
    // 1. Create Starter Product
    console.log('Creating Starter plan ($49/month)...');
    const starterProduct = await stripe.products.create({
      name: 'Design-Rite Starter',
      description: '10 documents storage, Basic AI assistant, Business tools, Email support',
      metadata: {
        tier: 'starter',
        max_documents: '10'
      }
    });

    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 4900, // $49.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 7
      },
      metadata: {
        tier: 'starter'
      }
    });

    console.log('✅ Starter created!');
    console.log(`   Product ID: ${starterProduct.id}`);
    console.log(`   Price ID: ${starterPrice.id}\n`);

    // 2. Create Professional Product
    console.log('Creating Professional plan ($199/month)...');
    const proProduct = await stripe.products.create({
      name: 'Design-Rite Professional',
      description: '50 documents storage, Advanced AI assistant, Voltage calculator, Analytics dashboard, Priority support',
      metadata: {
        tier: 'pro',
        max_documents: '50'
      }
    });

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 19900, // $199.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 7
      },
      metadata: {
        tier: 'pro'
      }
    });

    console.log('✅ Professional created!');
    console.log(`   Product ID: ${proProduct.id}`);
    console.log(`   Price ID: ${proPrice.id}\n`);

    // 3. Create Enterprise Product
    console.log('Creating Enterprise plan ($499/month)...');
    const enterpriseProduct = await stripe.products.create({
      name: 'Design-Rite Enterprise',
      description: 'Unlimited documents, Full AI capabilities, Custom integrations, Dedicated support, Team collaboration',
      metadata: {
        tier: 'enterprise',
        max_documents: 'unlimited'
      }
    });

    const enterprisePrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 49900, // $499.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 7
      },
      metadata: {
        tier: 'enterprise'
      }
    });

    console.log('✅ Enterprise created!');
    console.log(`   Product ID: ${enterpriseProduct.id}`);
    console.log(`   Price ID: ${enterprisePrice.id}\n`);

    // Print summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 All products created successfully!\n');
    console.log('📋 Add these to your .env.local file:\n');
    console.log('NEXT_PUBLIC_STRIPE_PRICE_STARTER=' + starterPrice.id);
    console.log('NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL=' + proPrice.id);
    console.log('NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE=' + enterprisePrice.id);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✨ Next steps:');
    console.log('1. Copy the price IDs above to your .env.local');
    console.log('2. Restart your dev server: npm run dev');
    console.log('3. Test at http://localhost:3005/start-trial\n');

  } catch (error) {
    console.error('❌ Error creating products:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n⚠️  Make sure STRIPE_SECRET_KEY is set in your .env.local');
    }
    process.exit(1);
  }
}

// Check if Stripe key is configured
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY not found in environment variables');
  console.error('Please add it to your .env.local file and try again.');
  process.exit(1);
}

// Run the script
createProducts();
