import { Hono } from 'hono'
import Stripe from 'stripe'

// Cloudflare thing that will provide environment bindings (API key text substitution)
type Bindings = {
  STRIPE_SECRET_KEY: string,
  STRIPE_PUBLISHABLE_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()


app.get('/api/config', async (c) => {
  return c.json({
    stripePublishableKey: c.env.STRIPE_PUBLISHABLE_KEY
  })
})

// stripe-related API calls
app.post('/api/create-checkout-session', async (c: any) => {
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { apiVersion: '2025-03-31.basil' } as any)
  const { amount } = await c.req.json(); // Get amount from request body
  
  try {

    // Stripe needs a fully qualified return URL
    const return_url = getCurrentBaseURL(c) + '/success?session_id={CHECKOUT_SESSION_ID}'

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Custom amount',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      return_url: return_url

    });

    return c.json({checkoutSessionClientSecret: session.client_secret});
  }
  catch(error) {
    return c.json({ error: `Failed to create checkout session: ${error}` }, 500);
  };
});

// count of successful payments
app.get('/api/successful-payments', async (c: any) => {
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { apiVersion: '2025-03-31.basil' } as any)

  try {
    // Create date for November 1, 2025
    // about when the Stripe payments were set up
    const novemberStart = new Date('2025-11-01T00:00:00Z');
    const timestampSeconds = Math.floor(novemberStart.getTime() / 1000);

    const paymentIntents = await stripe.paymentIntents.list({
      created: { gte: timestampSeconds }, // Greater than or equal to November 1, 2025
      limit: 1000 // Adjust as needed, max is 1000 per request
    });

    // Filter for only successful payments
    const successfulPayments = paymentIntents.data.filter(
      payment => payment.status === 'succeeded'
    );

    return c.json({
      total_successful_payments: successfulPayments.length,
      payments: successfulPayments.map(payment => ({
        amount: payment.amount,
        currency: payment.currency,
      }))
    });

  } catch (error) {
    return c.json({ error: `Failed to fetch payments: ${error}` }, 500);
  }
});

function getCurrentBaseURL(context: any) {
  const url = context.req.url;
  const protocol = url.startsWith('https') ? 'https' : 'http';
  const base_domain = url.split('://')[1].split('/')[0];
  return `${protocol}://${base_domain}`;
}


export default app
