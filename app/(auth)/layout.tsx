import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authenticate • Lawyer Diary",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sap-shell flex min-h-screen w-full items-center justify-center">
      <div className="w-full max-w-md px-4 py-10">
        <div className="sap-card">
          <div className="sap-card-body space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}


