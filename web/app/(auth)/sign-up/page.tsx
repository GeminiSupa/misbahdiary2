import { redirect } from "next/navigation";

export default function SignUpPage() {
  // Registration is disabled - redirect to sign-in
  redirect("/sign-in");
}


