"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText, ChevronRight, Scale, Users, Building2, Gavel } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  {
    title: "Talaq Notice",
    category: "Family",
    icon: Users,
    href: "/guides/how-to-file-divorce-pakistan#sample-talaq",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Khula Petition",
    category: "Family",
    icon: Scale,
    href: "/guides/how-to-file-divorce-pakistan#sample-khula",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
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
    title: "Company Registration",
    category: "Corporate",
    icon: Building2,
    href: "/secp-company-registration-pakistan",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
];

export function TemplatesWidget() {
  return (
    <Card className="h-full overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl">
      <CardContent className="p-4 sm:p-5 md:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-100 sm:text-xl">Legal Templates</h3>
            <p className="text-xs text-slate-400">Quick access to sample drafts & guides</p>
          </div>
          <Link
            href="/guides"
            className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
          >
            Browse all
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((template, i) => (
            <Link
              key={i}
              href={template.href}
              className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 transition-all hover:border-white/10 hover:bg-white/10"
            >
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", template.bg, template.color)}>
                <template.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                  {template.title}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  {template.category}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
            </Link>
          ))}
        </div>

        <div className="mt-5 rounded-xl bg-linear-to-br from-teal-500/10 to-blue-500/10 p-4 border border-teal-500/20">
          <p className="text-xs font-bold text-teal-300 mb-1">Featured Guide</p>
          <h4 className="text-sm font-black text-white mb-2 leading-tight">
            How to File Divorce in Pakistan – 2026 Complete Procedure
          </h4>
          <Link
            href="/guides/how-to-file-divorce-pakistan"
            className="inline-flex items-center text-xs font-bold text-teal-400 hover:text-teal-300"
          >
            Read Full Guide
            <ChevronRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
