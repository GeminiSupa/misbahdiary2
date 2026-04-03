"use server";

export async function initiateGoogleOAuth(): Promise<{ url: string } | { error: string }> {
  return { error: "Use client-side Google OAuth flow from the sign-in page." };
}
