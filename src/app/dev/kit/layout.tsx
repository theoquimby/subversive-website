import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "./kit.css";

// The kitchen sink exists only when NEXT_PUBLIC_DEV_KIT=1 at build (plan Q1) and is never
// indexed. Without the flag every /dev/kit request is a 404.
export const metadata: Metadata = {
  title: "Kit · Subversive",
  robots: { index: false, follow: false },
};

export default function KitLayout({ children }: { children: ReactNode }) {
  if (process.env.NEXT_PUBLIC_DEV_KIT !== "1") notFound();
  return children;
}
