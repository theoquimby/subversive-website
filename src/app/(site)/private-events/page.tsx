// /private-events: the inquiry form for booking the taproom (Ops contract §5). The title
// beside a ticket in pen, the form, and the phone and email as the other ways to ask. When
// the Ops address is not configured the form is left out and only those two remain, so
// the page never offers a form that cannot be sent.
//
// TODO(Max): a sentence or two about private events (what can be booked, for how many).
// None exists in the old site's content, so the page says nothing it was not given.
import { inquiryLabels, microcopy } from "@content/microcopy";
import type { Metadata } from "next";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { Drawing } from "@/components/home/Ways";
import { PageWipe } from "@/components/layout/PageWipe";
import { getSite } from "@/lib/site/site";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Private events · Subversive, Catskill NY",
  description: "Ask about booking a private event at Subversive, 96 West Bridge Street, Catskill NY.",
};

export default function PrivateEventsPage() {
  const site = getSite();
  const ops = (process.env.NEXT_PUBLIC_OPS_ORIGIN ?? "").replace(/\/+$/, "");
  return (
    <PageWipe>
      <div className="page prose-page">
        <header className="prose-head">
          <h1 className="page__title">{inquiryLabels.title}</h1>
          <Drawing name="events" className="prose-head__art" />
        </header>

        <div className="inquiry-wrap">
          {ops ? <InquiryForm endpoint={`${ops}/api/public/inquiry`} /> : null}
          <p className="inquiry__other">
            <a className="text-link tabular" href={`tel:${site.phone.tel}`}>
              {site.phone.display}
            </a>
            <a className="text-link" href={`mailto:${site.email}`}>
              {microcopy.emailUs}
            </a>
            <span className="inquiry__note">{site.phone.note}</span>
          </p>
        </div>
      </div>
    </PageWipe>
  );
}
