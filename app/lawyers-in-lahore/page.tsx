import type { Metadata } from "next";
import { CityDirectory } from "@/components/CityDirectory";
import { CITY_DATA } from "@/lib/city-data";

export const metadata: Metadata = {
  title: `Best Lawyers in Lahore | Lawyer Listings & Legal Services`,
  description: `Find top-rated lawyers and law firms in Lahore. Explore practice areas, FAQs, and contact information for legal services in Lahore, Pakistan.`,
  alternates: { canonical: "/lawyers-in-lahore" },
};

export default function LahoreLawyersPage() {
  return <CityDirectory cityKey="lahore" />;
}
