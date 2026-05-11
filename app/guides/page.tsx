import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FileText, Scale, ChevronRight, Gavel, Building2, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Legal Guides & Resources | Lawyer Diary Pakistan",
  description: "Explore comprehensive legal guides, procedure walk-throughs, and sample drafts for law practitioners and citizens in Pakistan.",
  alternates: { canonical: "/guides" },
};

const GUIDES = [
  {
    title: "How to File Divorce in Pakistan",
    desc: "A complete step-by-step procedure for Talaq and Khula, including sample drafts and legal requirements for 2026.",
    icon: Users,
    href: "/guides/how-to-file-divorce-pakistan",
    category: "Family Law",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Company Registration Guide",
    desc: "Learn the legal procedure for registering a private limited company with the SECP in Pakistan.",
    icon: Building2,
    href: "/secp-company-registration-pakistan",
    category: "Corporate Law",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    title: "Criminal Bail Application Procedure",
    desc: "Understanding pre-arrest and post-arrest bail procedures in Pakistani trial courts and high courts.",
    icon: Gavel,
    href: "/guides/criminal-bail-application-pakistan",
    category: "Criminal Law",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    title: "Property Transfer & Documentation",
    desc: "A guide to the legal requirements for transferring residential and commercial property in Pakistan.",
    icon: Scale,
    href: "#",
    category: "Property Law",
    color: "text-teal-500",
    bg: "bg-teal-500/10",
  },
];

export default function GuidesPage() {
  return (
    <div className="sap-shell bg-slate-50 dark:bg-[#070B12]">
      <div className="bg-slate-900 py-16 sm:py-20">
        <div className="sap-container">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Legal <span className="text-teal-400">Guides</span>
            </h1>
            <p className="text-lg text-slate-400">
              Expert resources and procedure walk-throughs for Pakistani law.
            </p>
          </div>
        </div>
      </div>

      <div className="sap-container py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {GUIDES.map((guide, i) => (
            <Link
              key={i}
              href={guide.href}
              className="group sap-card flex flex-col justify-between overflow-hidden transition-all hover:border-primary/50"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${guide.bg} ${guide.color}`}>
                    <guide.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded">
                    {guide.category}
                  </span>
                </div>
                <div className="mt-6 space-y-2">
                  <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {guide.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {guide.desc}
                  </p>
                </div>
              </div>
              <div className="border-t border-border/60 bg-muted/20 px-6 py-4 flex items-center justify-between text-sm font-bold text-primary">
                Read Guide
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
