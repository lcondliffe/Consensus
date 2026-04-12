const clerkIssuerUrl = process.env.CLERK_ISSUER_URL;

if (!clerkIssuerUrl) {
  throw new Error(
    "Missing CLERK_ISSUER_URL. Configure your Clerk issuer URL explicitly; refusing to fall back to a development Clerk instance.",
  );
}

export default {
  providers: [
    {
      domain: clerkIssuerUrl,
      applicationID: "convex",
    },
  ],
};
