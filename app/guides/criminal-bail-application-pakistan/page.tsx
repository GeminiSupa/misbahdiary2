import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Scale, Gavel, ShieldAlert, Clock, BookOpen, AlertCircle, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Criminal Bail Application Procedure in Pakistan – 2026 Legal Guide",
  description: "A comprehensive guide on filing pre-arrest and post-arrest bail applications in Pakistan, including sample drafts and legal requirements under CrPC.",
  alternates: { canonical: "/guides/criminal-bail-application-pakistan" },
};

export default function BailGuidePage() {
  return (
    <div className="sap-shell min-h-screen bg-slate-50 dark:bg-[#070B12]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 py-16 sm:py-24 text-white">
        <div className="sap-container relative">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-sm font-bold text-red-400 border border-red-500/20">
              Criminal Law Guide
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
              Criminal <span className="text-red-400">Bail</span> Procedure
            </h1>
            <p className="text-lg text-slate-300 sm:text-xl">
              Complete procedure for filing Pre-Arrest and Post-Arrest bail applications in Pakistan.
            </p>
          </div>
        </div>
      </div>

      <div className="sap-container py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <article className="prose prose-slate max-w-none dark:prose-invert">
            <section className="sap-card p-6 sm:p-8 mb-12">
              <h2 className="text-xl font-bold mt-0">Overview</h2>
              <p>
                In Pakistan, the right to bail is a fundamental principle of criminal justice, based on the presumption of innocence. Bail can be sought at different stages of a criminal case under the **Code of Criminal Procedure (CrPC), 1898**.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 mt-4">
                <div className="rounded-xl border bg-blue-500/5 p-4">
                  <h4 className="font-bold text-blue-600 dark:text-blue-400 m-0">Pre-Arrest Bail</h4>
                  <p className="text-xs m-0 mt-1">Sought under Section 498 CrPC to prevent arrest in cases of mala fide intentions or ulterior motives.</p>
                </div>
                <div className="rounded-xl border bg-teal-500/5 p-4">
                  <h4 className="font-bold text-teal-600 dark:text-teal-400 m-0">Post-Arrest Bail</h4>
                  <p className="text-xs m-0 mt-1">Sought under Section 497 CrPC after the accused has been arrested or taken into custody.</p>
                </div>
              </div>
            </section>

            <h2 className="text-2xl font-black flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" /> Grounds for Bail
            </h2>
            <p>Courts generally grant bail based on several factors, including:</p>
            <ul>
              <li><strong>Further Inquiry:</strong> When there is no direct evidence and the case requires further investigation.</li>
              <li><strong>Mala Fide:</strong> When the FIR is registered with malicious intent or for harassment.</li>
              <li><strong>Delay in FIR:</strong> Significant unexplained delay in reporting the crime.</li>
              <li><strong>Lack of Incriminating Material:</strong> Absence of physical or forensic evidence connecting the accused to the crime.</li>
              <li><strong>Statutory Grounds:</strong> For elderly, women, or sick persons, or due to prolonged trial delays.</li>
            </ul>

            <h2 id="sample-bail" className="text-2xl font-black mt-12">Sample Bail Application Draft</h2>
            <div className="relative">
              <pre className="bg-slate-950 text-slate-200 p-6 rounded-xl overflow-x-auto text-sm leading-relaxed border border-white/10 shadow-xl">
{`IN THE COURT OF THE LEARNED SESSIONS JUDGE, [CITY NAME]

Criminal Misc. Bail Application No. ________ of 20____

[Name of Accused/Petitioner]
Son of [Father’s Name]
Resident of [Full Address]
... Petitioner/Accused

VERSUS

The State
Through the Station House Officer (SHO),
Police Station: [Name of Police Station]
... Respondent

CASE FIR NO: [Number] | DATED: [Date]
OFFENCE UNDER SECTION(S): [e.g., 302/34, 420/468/471] PPC
POLICE STATION: [Name of Police Station]

APPLICATION UNDER SECTION 497/498 OF CrPC FOR THE GRANT OF BAIL.

RESPECTFULLY SHOWETH:

1. That the Petitioner is innocent and has been falsely implicated 
   in the instant case due to mala fide and enmity.
2. That the allegations levelled against the petitioner are vague 
   and devoid of any incriminating material.
3. That the case is one of "further inquiry" within the meaning 
   of Section 497(2) of the CrPC.
4. That the petitioner is a law-abiding citizen and not a flight risk.
5. That the petitioner is ready to furnish solvent surety to the 
   satisfaction of this Honourable Court.

PRAYER:
It is most respectfully prayed that this Honourable Court may 
graciously be pleased to grant bail to the Petitioner.

Petitioner/Accused
Through: [Name of Advocate]`}
              </pre>
            </div>

            <h2 className="text-2xl font-black mt-12">Required Documents</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 p-4 rounded-xl border">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <h4 className="font-bold m-0 text-sm">Certified Copy of FIR</h4>
                  <p className="text-xs text-muted-foreground m-0 mt-1">The first information report is the basis of the case.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl border">
                <ShieldAlert className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <h4 className="font-bold m-0 text-sm">Vakalatnama</h4>
                  <p className="text-xs text-muted-foreground m-0 mt-1">The power of attorney for your legal representative.</p>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <div className="space-y-8">
            <aside className="sap-card p-6 bg-red-600 text-white">
              <h3 className="text-lg font-bold mb-3">Arrested or Facing Charges?</h3>
              <p className="text-sm opacity-90 mb-6">
                Consult with criminal defense experts in your city immediately.
              </p>
              <div className="space-y-2">
                <Link href="/lawyers-in-islamabad" className="flex items-center justify-between rounded-lg bg-white/10 p-3 text-xs font-bold hover:bg-white/20 transition-colors">
                  Islamabad Lawyers <ChevronRight className="h-4 w-4" />
                </Link>
                <Link href="/lawyers-in-karachi" className="flex items-center justify-between rounded-lg bg-white/10 p-3 text-xs font-bold hover:bg-white/20 transition-colors">
                  Karachi Lawyers <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>

            <aside className="sap-card p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
                <AlertCircle className="h-5 w-5 text-amber-500" /> Legal Disclaimer
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This is a general template and guide. Criminal laws are highly sensitive to specific facts. Always consult a qualified advocate before filing any application in court.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
