import Image from "next/image";
import Link from "next/link";
import { Linkedin, Facebook } from "lucide-react";

const LINKEDIN_URL = "https://www.linkedin.com/company/ux4u-erp/?viewAsMember=true";
const FACEBOOK_URL = "https://www.facebook.com/ux4u.erpsolutions";

const LAWYER_RESOURCES = [
  { label: "Pakistan Bar Council", href: "https://www.pakistanbarcouncil.org/" },
  { label: "Supreme Court Judgments", href: "https://www.supremecourt.gov.pk/" },
  { label: "Islamabad High Court Judgments", href: "https://mis.ihc.gov.pk/" },
  { label: "Lahore High Court Judgments", href: "https://lhc.gov.pk/" },
  { label: "Sindh High Court Judgments", href: "https://www.sindhhighcourt.gov.pk/" },
  { label: "Peshawar High Court Judgments", href: "https://peshawarhighcourt.gov.pk/" },
  { label: "Balochistan High Court Judgments", href: "https://bhc.gov.pk/" },
];

const socialLinks = [
  { icon: Linkedin, href: LINKEDIN_URL, label: "LinkedIn" },
  { icon: Facebook, href: FACEBOOK_URL, label: "Facebook" },
];

type LandingFooterProps = {
  variant?: "landing" | "legal";
};

export function LandingFooter({ variant = "landing" }: LandingFooterProps) {
  const bgClass =
    variant === "landing" ? "bg-slate-100" : "bg-slate-50";
  const idAttr = variant === "landing" ? "for-firms" : undefined;

  return (
    <footer
      id={idAttr}
      className={`border-t border-black/10 ${bgClass} py-5`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Brand + Social + Legal in one compact row */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:gap-6">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
            <Link href="/" className="shrink-0">
              <Image
                src="/ux4u-logo.png"
                alt="UX4U"
                width={64}
                height={20}
                className="h-5 w-auto"
              />
            </Link>
            <span className="text-xs text-black/60">Lawyer Diary by UX4U</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target={href !== "#" ? "_blank" : undefined}
                rel={href !== "#" ? "noopener noreferrer" : undefined}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-black/50 transition hover:bg-black/5 hover:text-[#E9730C]"
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
            <span className="hidden text-black/30 sm:inline" aria-hidden>|</span>
            <Link href="/blog" className="text-xs text-black/60 hover:text-black">
              Blog
            </Link>
            <Link href="/privacy" className="text-xs text-black/60 hover:text-black">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-black/60 hover:text-black">
              Terms
            </Link>
            <Link href="/sign-in" className="text-xs text-black/60 hover:text-black">
              Sign In
            </Link>
          </div>
        </div>

        {/* Resources + Made with - compact single line */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-black/5 pt-4 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-black/40">
            Resources:
          </span>
          {LAWYER_RESOURCES.map((resource) => (
            <a
              key={resource.label}
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-black/60 underline-offset-1 hover:text-[#E9730C] hover:underline"
            >
              {resource.label}
            </a>
          ))}
          <span className="mx-1 text-black/30">·</span>
          <span className="text-[11px] text-black/45">Made with care for advocates in Pakistan</span>
        </div>
      </div>
    </footer>
  );
}
