import Link from "next/link";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Separator } from "@/components/ui/separator";

export default function SignInPage() {
  return (
    <div className="space-y-6">
      <SignInForm />

      <Separator className="my-6" />

      <p className="text-center text-sm text-muted-foreground">
        Need an account?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}


