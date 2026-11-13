import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Our beer · Subversive, Catskill NY" };

export default function Page() {
  return <StubPage title="Our beer" />;
}
