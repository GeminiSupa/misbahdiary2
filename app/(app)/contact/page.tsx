import { ContactForm } from "@/components/contact/contact-form";
import { Mail, MessageCircle, MapPin } from "lucide-react";

export const metadata = {
  title: "Contact Us • Lawyer Diary",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
      {/* Hero Header - SAP Fiori Horizon Style */}
      <div className="sap-card-hero">
        <div className="sap-card-body">
          <div className="sap-card-header">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-sm shrink-0 sm:h-14 sm:w-14">
                <Mail className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Contact Us</h1>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  Get in touch with our support team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-5 md:grid-cols-2">
        <div className="sap-card-success">
          <div className="sap-card-body space-y-4">
            <div className="sap-card-header">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground sm:text-lg">Get in Touch</h2>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  We're here to help! Reach out to us through any of these channels.
                </p>
              </div>
            </div>
            <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Email</p>
                <a
                  href="mailto:info@ux4u.online"
                  className="text-primary hover:underline"
                >
                  info@ux4u.online
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">WhatsApp</p>
                <a
                  href="https://wa.me/923255116929"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  +92 325 511 6929
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">Pakistan</p>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="sap-card-success">
          <div className="sap-card-body space-y-4">
            <div className="sap-card-header">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground sm:text-lg">Send us a Message</h2>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
