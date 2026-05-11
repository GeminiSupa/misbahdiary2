import type { Metadata } from "next";
import { CityDirectory } from "@/components/CityDirectory";
import { CITY_DATA } from "@/lib/city-data";

export const metadata: Metadata = {
  title: `Best Lawyers in Karachi | Lawyer Listings & Legal Services`,
  description: `Find top-rated lawyers and law firms in Karachi. Explore practice areas, FAQs, and contact information for legal services in Karachi, Pakistan.`,
  alternates: { canonical: "/lawyers-in-karachi" },
};

export default function KarachiLawyersPage() {
  return <CityDirectory cityKey="karachi" />;
}
