export const dynamic = "force-static";

export default function ConfirmEmailPage() {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Verify your email
      </h1>
      <p className="text-sm text-muted-foreground">
        We sent a confirmation link to your inbox. Open it to activate your
        Lawyer Diary account. If the email hasn&rsquo;t arrived after a minute,
        check your spam folder or resend from the sign-in screen.
      </p>
    </div>
  );
}


