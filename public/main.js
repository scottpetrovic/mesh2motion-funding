// publishable key for Stripe
// it is ok if people see this key when the site is built
// it is a variable to help when switching between test and live environments for Stripe

// Initialize Stripe with key from API
let stripe;
async function initStripe() {
  const config = await fetch('/api/config').then(r => r.json());
  stripe = Stripe(config.stripePublishableKey);
}


document.addEventListener('DOMContentLoaded', async () => {
    await initStripe();
    loadStripeEmbeddedWidget(23400);
    loadSuccessfulPayments();
})

const fetchClientSecret = async (amount) => {
  return await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    })
    .then((response) => response.json())
    .then((json) => json.checkoutSessionClientSecret);
};



// test payment card info
// successful payment card:  4242 4242 4242 4242

async function loadStripeEmbeddedWidget(amount = 10000) {

    const checkout = await stripe.initEmbeddedCheckout({
      fetchClientSecret: () => fetchClientSecret(amount)
    });

    const checkoutContainer = document.getElementById('checkout-container');
    checkoutContainer.innerHTML = ''; // Clear previous content
    checkout.mount('#checkout-container');
}



async function loadSuccessfulPayments() {

  fetch('/api/successful-payments')
    .then(response => response.json())
    .then(data => {

      // You can update the UI with this data as needed
      const successfulPaymentsCount = document.getElementById('successful-payments-count');
      if (successfulPaymentsCount) {
        successfulPaymentsCount.textContent = data.total_successful_payments
      }

      const cumulativePaymentAmount = document.getElementById('cumulative-payment-amount');
      if (cumulativePaymentAmount) {
        const totalAmount = data.payments.reduce((sum, payment) => sum + payment.amount, 0);
        cumulativePaymentAmount.textContent = (totalAmount / 100).toFixed(2);
      }

  })
}