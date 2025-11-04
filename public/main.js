// publishable key for Stripe
// it is ok if people see this key when the site is built
// it is a variable to help when switching between test and live environments for Stripe
const stripe = Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    loadStripeEmbeddedWidget();
    loadSuccessfulPayments();
})

// test payment card info
// successful payment card:  4242 4242 4242 4242

async function loadStripeEmbeddedWidget() {
    const clientSecret = await fetch('/api/create-checkout-session', {method: 'POST'})
      .then((response) => response.json())
      .then((json) => json.checkoutSessionClientSecret);

      console.log('Starting checkout with client secret: ', clientSecret);
      const checkout = await stripe.initEmbeddedCheckout({
        clientSecret: clientSecret
      });

      const checkoutContainer = document.getElementById('checkout-container');
      checkoutContainer.innerHTML = ''; // Clear previous content
      checkout.mount('#checkout-container');
}

async function loadSuccessfulPayments() {

  fetch('/api/successful-payments')
    .then(response => response.json())
    .then(data => {
      console.log('Total successful payments:', data.total_successful_payments);

      // You can update the UI with this data as needed
      const successfulPaymentsCount = document.getElementById('successful-payments-count');
      if (successfulPaymentsCount) {
        successfulPaymentsCount.textContent = `Total Successful Payments: ${data.total_successful_payments}`;
      }

      const cumulativePaymentAmount = document.getElementById('cumulative-payment-amount');
      if (cumulativePaymentAmount) {
        const totalAmount = data.payments.reduce((sum, payment) => sum + payment.amount, 0);
        cumulativePaymentAmount.textContent = `Cumulative Payment Amount: $${(totalAmount / 100).toFixed(2)}`;
      }

  })
}