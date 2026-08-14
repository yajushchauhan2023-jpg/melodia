const base = (title: string, body: string, ctaText?: string, ctaUrl?: string) => `
  <div style="font-family:Inter,Arial,sans-serif;background:#fffaf0;padding:32px;color:#23304a">
    <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e7e2d8;border-radius:24px;padding:32px;box-shadow:0 18px 50px rgba(35,48,74,.12)">
      <div style="font-size:24px;font-weight:900;color:#1f3f9f;margin-bottom:24px">♪ Melodia</div>
      <h1 style="font-size:28px;line-height:1.15;margin:0 0 16px">${title}</h1>
      <div style="font-size:16px;line-height:1.7;color:#6b7280">${body}</div>
      ${ctaText && ctaUrl ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:24px;background:#4169e1;color:white;text-decoration:none;border-radius:999px;padding:14px 20px;font-weight:800">${ctaText}</a>` : ""}
    </div>
  </div>
`;

export const emails = {
  welcome: () => ({
    subject: "Welcome to your 30-day Melodia trial",
    html: base("Welcome to Melodia", "<p>Your full premium trial is active. Start with one small practice win today.</p>")
  }),
  trialEndingSoon: (days: number, appUrl: string) => ({
    subject: `Your Melodia trial ends in ${days} days`,
    html: base("Your free trial ends soon", `<p>You have ${days} days left in your Melodia trial. You can keep learning automatically or manage your subscription anytime.</p>`, "Manage billing", `${appUrl}/dashboard/billing`)
  }),
  paymentSuccess: () => ({
    subject: "Your Melodia subscription is active",
    html: base("Subscription active", "<p>Your payment was successful. Your premium music learning access continues uninterrupted.</p>")
  }),
  paymentFailed: (appUrl: string) => ({
    subject: "Update your Melodia payment method",
    html: base("Your music journey is paused soon", "<p>We could not process your payment. Please update your payment method within 7 days to keep premium access.</p>", "Update payment method", `${appUrl}/payment-failed`)
  }),
  canceled: () => ({
    subject: "Your Melodia subscription was canceled",
    html: base("Sorry to see you go", "<p>Your plan has been canceled. You can continue using premium access until the end of the current billing period.</p>")
  })
};
