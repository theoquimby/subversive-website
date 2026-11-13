import { notFound } from "next/navigation";

// Any unknown path inside the site renders the site's own 404 (with the header and footer).
export default function Missing() {
  notFound();
}
