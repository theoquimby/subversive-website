import type { Metadata } from "next";
import { StubPage } from "@/components/layout/StubPage";

export const revalidate = 300;
export const metadata: Metadata = { title: "Events · Subversive, Catskill NY" };

export default function Page() {
  return <StubPage title="Events" />;
}
