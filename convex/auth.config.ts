export default {
  providers: [
    {
      // The hardcoded value is the fallback for local development
      domain: process.env.CLERK_ISSUER_URL || "https://touching-jackal-7.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
