import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Scale, CheckCircle2, AlertCircle, Clock, BookOpen, UserCheck, ShieldCheck, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "How to File Divorce in Pakistan – Complete Legal Procedure (2026 Guide)",
  description: "A comprehensive guide on divorce laws in Pakistan, including Talaq and Khula procedures, required documents, court process, and sample drafts.",
  alternates: { canonical: "/guides/how-to-file-divorce-pakistan" },
};

export default function DivorceGuidePage() {
  return (
    <div className="sap-shell min-h-screen bg-slate-50 dark:bg-[#070B12]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
        </div>
        <div className="sap-container relative">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center rounded-full bg-teal-500/10 px-3 py-1 text-sm font-bold text-teal-400 border border-teal-500/20">
              2026 Legal Guide
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
              How to File Divorce in <span className="text-teal-400">Pakistan</span>
            </h1>
            <p className="text-lg text-slate-300 sm:text-xl">
              A complete step-by-step procedure for Talaq and Khula, including sample drafts and legal requirements.
            </p>
          </div>
        </div>
      </div>

      <div className="sap-container py-12 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <article className="prose prose-slate max-w-none dark:prose-invert">
            <section className="sap-card bg-card p-6 sm:p-8 space-y-6 mb-12">
              <p className="text-lg leading-relaxed text-muted-foreground">
                Divorce in Pakistan is governed primarily by the **Muslim Family Laws Ordinance 1961** and related family laws. Whether initiated by the husband through Talaq or by the wife through Khula, the process involves legal notices, reconciliation proceedings, and court procedures.
              </p>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <h3 className="flex items-center gap-2 text-base font-bold m-0 mb-2">
                    <BookOpen className="h-4 w-4 text-primary" /> What you&apos;ll learn
                  </h3>
                  <ul className="m-0 list-none space-y-1 p-0 text-sm">
                    <li>• Divorce laws & frameworks</li>
                    <li>• Talaq & Khula procedures</li>
                    <li>• Required documentation</li>
                    <li>• Step-by-step court process</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <h3 className="flex items-center gap-2 text-base font-bold m-0 mb-2">
                    <FileText className="h-4 w-4 text-primary" /> Practical Tools
                  </h3>
                  <ul className="m-0 list-none space-y-1 p-0 text-sm">
                    <li>• Sample divorce applications</li>
                    <li>• Legal rights analysis</li>
                    <li>• Custody & Maintenance info</li>
                    <li>• Important court judgments</li>
                  </ul>
                </div>
              </div>
            </section>

            <h2 id="laws" className="flex items-center gap-3 text-2xl font-black">
              <Scale className="h-6 w-6 text-primary" /> Understanding Divorce Laws
            </h2>
            <p>In Pakistan, divorce can occur through several legal methods, primarily categorized by who initiates the process.</p>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sap-card p-6 border-l-4 border-l-blue-500">
                <h3 className="text-lg font-bold mt-0">1. Talaq (By Husband)</h3>
                <p className="text-sm text-muted-foreground">
                  A Muslim husband has the legal right to pronounce Talaq. However, verbal divorce alone is not sufficient for legal recognition. He must notify the Union Council to complete the 90-day reconciliation period.
                </p>
              </div>
              <div className="sap-card p-6 border-l-4 border-l-purple-500">
                <h3 className="text-lg font-bold mt-0">2. Khula (By Wife)</h3>
                <p className="text-sm text-muted-foreground">
                  A wife may seek dissolution of marriage through Khula if she cannot continue the marriage within Islamic limits. This is granted through the Family Court when mutual reconciliation fails.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-black mt-12">The Legal Framework</h2>
            <p>The primary laws regulating family matters in Pakistan include:</p>
            <ul>
              <li><strong>Muslim Family Laws Ordinance 1961</strong></li>
              <li><strong>Family Courts Act 1964</strong></li>
              <li><strong>West Pakistan Family Courts Rules</strong></li>
            </ul>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 my-10">
              <h3 className="flex items-center gap-2 text-primary font-bold m-0 mb-4">
                <ShieldCheck className="h-5 w-5" /> Step-by-Step Procedure for Talaq
              </h3>
              <div className="space-y-6">
                {[
                  { step: "1", title: "Pronouncement", desc: "The husband pronounces Talaq verbally or in writing (Written is strongly recommended for evidence)." },
                  { step: "2", title: "Notice to Union Council", desc: "Written notice must be sent to the Chairman of the Union Council and a copy provided to the wife." },
                  { step: "3", title: "Reconciliation", desc: "The Union Council forms an Arbitration Council to attempt reconciliation. This lasts 90 days." },
                  { step: "4", title: "Certificate", desc: "If reconciliation fails, a Divorce Effectiveness Certificate is issued as final legal proof." }
                ].map((s, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="font-bold m-0 text-foreground">{s.title}</h4>
                      <p className="text-sm m-0 text-muted-foreground mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <h2 id="sample-talaq" className="text-2xl font-black mt-12">Sample Talaq Application Draft</h2>
            <div className="relative">
              <pre className="bg-slate-950 text-slate-200 p-6 rounded-xl overflow-x-auto text-sm leading-relaxed border border-white/10 shadow-xl">
{`To,
The Chairman,
Union Council [Area Name]

Subject: Notice of Talaq Under Section 7 of Muslim Family Laws Ordinance 1961

Sir,

I, [Husband Name], son of [Father Name], resident of [Address], hereby notify 
that I have pronounced Talaq upon my wife, [Wife Name], daughter of [Father Name], 
on [Date].

You are requested to initiate reconciliation proceedings as required under law.

Copy of this notice has been sent to my wife.

Regards,
[Name]
[Signature]`}
              </pre>
            </div>

            <h2 id="khula" className="text-2xl font-black mt-12">Procedure for Khula (By Wife)</h2>
            <p>Unlike Talaq, Khula requires a judicial decree from the Family Court.</p>
            <ol>
              <li><strong>Hire a Family Lawyer:</strong> Prepare and file the Khula suit.</li>
              <li><strong>Filing the Suit:</strong> Present marriage details, grounds for Khula, and failure of reconciliation.</li>
              <li><strong>Court Notices:</strong> The court issues notices to the husband.</li>
              <li><strong>Reconciliation Attempt:</strong> The judge must attempt to reconcile the parties.</li>
              <li><strong>Decree of Khula:</strong> If reconciliation fails, the court grants the decree.</li>
            </ol>

            <h2 id="sample-khula" className="text-2xl font-black mt-12">Sample Khula Petition Draft</h2>
            <div className="relative">
              <pre className="bg-slate-950 text-slate-200 p-6 rounded-xl overflow-x-auto text-sm leading-relaxed border border-white/10 shadow-xl">
{`IN THE COURT OF FAMILY JUDGE

Plaintiff: [Mst. Wife Name]
Versus
Defendant: [Husband Name]

SUIT FOR DISSOLUTION OF MARRIAGE ON THE BASIS OF KHULA

Respectfully Sheweth:

1. That the marriage between the parties was solemnized on [Date].
2. That the parties cannot live together within the limits prescribed by Islam.
3. That reconciliation efforts have failed.
4. That the plaintiff seeks dissolution of marriage through Khula.

Prayer:
It is respectfully prayed that decree for dissolution of marriage 
on basis of Khula may kindly be granted.

Plaintiff
Through Counsel`}
              </pre>
            </div>

            <h2 className="text-2xl font-black mt-12">Important Judgments</h2>
            <div className="space-y-4">
              <div className="sap-card p-5 bg-muted/20">
                <h4 className="m-0 font-bold text-primary">Khurshid Bibi v. Muhammad Amin (PLD 1967 SC 97)</h4>
                <p className="text-sm m-0 mt-1">Established the independent right of a woman to seek Khula through judicial intervention.</p>
              </div>
              <div className="sap-card p-5 bg-muted/20">
                <h4 className="m-0 font-bold text-primary">Kaneez Fatima v. Wali Muhammad (PLD 1993 SC 901)</h4>
                <p className="text-sm m-0 mt-1">Reaffirmed that forcing a woman to remain in a hateful marriage is against Islamic principles.</p>
              </div>
            </div>

            <h2 className="text-2xl font-black mt-12">Rights After Divorce</h2>
            <p>A divorced wife in Pakistan is entitled to several legal protections:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Deferred dower (Haq Mehr)",
                "Maintenance during iddat period",
                "Child maintenance (if applicable)",
                "Custody rights (Hizanat)"
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-teal-500" /> {r}
                </div>
              ))}
            </div>
          </article>

          {/* Sidebar */}
          <div className="space-y-8">
            <aside className="sticky top-24 space-y-6">
              <div className="sap-card p-6 bg-primary text-primary-foreground">
                <h3 className="text-lg font-bold mb-3">Need Legal Help?</h3>
                <p className="text-sm opacity-90 mb-6">
                  Consult with expert family lawyers in your city to ensure your rights are protected.
                </p>
                <div className="space-y-3">
                  <Link href="/lawyers-in-islamabad" className="flex items-center justify-between rounded-lg bg-white/10 p-3 text-xs font-bold hover:bg-white/20 transition-colors">
                    Lawyers in Islamabad <ChevronRight className="h-4 w-4" />
                  </Link>
                  <Link href="/lawyers-in-lahore" className="flex items-center justify-between rounded-lg bg-white/10 p-3 text-xs font-bold hover:bg-white/20 transition-colors">
                    Lawyers in Lahore <ChevronRight className="h-4 w-4" />
                  </Link>
                  <Link href="/lawyers-in-karachi" className="flex items-center justify-between rounded-lg bg-white/10 p-3 text-xs font-bold hover:bg-white/20 transition-colors">
                    Lawyers in Karachi <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="sap-card p-6">
                <h3 className="text-lg font-bold mb-4">Required Documents</h3>
                <ul className="space-y-3 m-0 p-0 list-none">
                  {[
                    "CNIC copies of both parties",
                    "Original Nikahnama (Marriage Contract)",
                    "Passport-sized photographs",
                    "Proof of address",
                    "Talaq notice or Khula plaint"
                  ].map((d, i) => (
                    <li key={i} className="flex gap-2 text-xs font-medium text-muted-foreground leading-snug">
                      <FileText className="h-4 w-4 shrink-0 text-primary" /> {d}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="sap-card p-6 bg-slate-50 dark:bg-slate-900 border-dashed">
                <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
                  <AlertCircle className="h-5 w-5 text-amber-500" /> Pro Tips
                </h3>
                <ul className="space-y-3 m-0 p-0 list-none text-xs text-muted-foreground leading-relaxed">
                  <li>• Verbal Talaq is religiously valid but legally incomplete without notice.</li>
                  <li>• Always keep postage receipts of the notices sent.</li>
                  <li>• Reconciliation is mandatory under Section 7.</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
