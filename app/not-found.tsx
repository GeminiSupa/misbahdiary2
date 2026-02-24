import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-4">
      <h1 className="text-2xl font-semibold text-black">Page not found</h1>
      <p className="text-black/70">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="rounded-md bg-[#f97316] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#ea580c]"
      >
        Back to Lawyer Diary
      </Link>
    </div>
  );
}
