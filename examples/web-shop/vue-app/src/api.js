export async function charge(amount) {
  return fetch('https://api.stripe.com/v1/charges', {
    method: 'POST',
    headers: { Authorization: `Bearer ${import.meta.env.VITE_STRIPE_SECRET_KEY}` },
    body: new URLSearchParams({ amount, currency: 'usd' }),
  })
}
