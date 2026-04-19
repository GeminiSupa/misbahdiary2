"use client";

import { useRouter } from "next/navigation";

export function StartRegistrationButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="inline-flex min-h-[44px] min-w-[160px] items-center justify-center rounded-lg bg-[#f97316] px-6 py-3 text-base font-medium text-white transition hover:bg-[#ea580c] active:scale-[0.98]"
      onClick={() => router.push("/services/secp-registration")}
    >
      Start Registration
    </button>
  );
}
