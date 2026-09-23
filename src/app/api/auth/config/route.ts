export async function GET() {
  const firebase = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
  return Response.json({
    firebase,
    devLogin: process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY,
    firebaseConfig: firebase
      ? {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        }
      : null,
  });
}
