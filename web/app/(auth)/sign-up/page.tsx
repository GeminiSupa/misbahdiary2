import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Separator } from "@/components/ui/separator";

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <SignUpForm />

      <Separator className="my-6" />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}


