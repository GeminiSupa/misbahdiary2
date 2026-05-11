import type { Metadata } from "next";
import { CityDirectory } from "@/components/CityDirectory";
import { CITY_DATA } from "@/lib/city-data";

export const metadata: Metadata = {
  title: `Best Lawyers in Islamabad | Lawyer Listings & Legal Services`,
  description: `Find top-rated lawyers and law firms in Islamabad. Explore practice areas, FAQs, and contact information for legal services in Islamabad, Pakistan.`,
  alternates: { canonical: "/lawyers-in-islamabad" },
};

export default function IslamabadLawyersPage() {
  return <CityDirectory cityKey="islamabad" />;
}
