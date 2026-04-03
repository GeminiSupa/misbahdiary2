import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { MagicLinkHashRecovery } from "@/components/auth/magic-link-hash-recovery";

export default function SignInPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <MagicLinkHashRecovery />
      </Suspense>
      <SignInForm />
    </div>
  );
}


