"use client";

// The private-event inquiry form. It posts straight to the Ops app (contract:
// subversive-ops/docs/website-integration.md §5), where the inquiry lands in Max's
// private-events pipeline. Name, a way to reach the person (email or phone), and
// optionally a date, a head count, the kind of event and a note.
//
// No native pickers: the date is typed (MM/DD/YYYY), the kind is a row of plain choices.
// A hidden field named "website" is a trap for bots and must stay empty. Errors from Ops
// name their field and are shown beside it; anything unexpected says to call or email.
import { inquiryLabels as L } from "@content/microcopy";
import { type FormEvent, useId, useState } from "react";
import { send } from "../layout/Beacon";

type Field = "name" | "email" | "phone" | "date" | "guests" | "type" | "message";
type State = { status: "idle" | "sending" | "sent" } | { status: "error"; field?: Field; message: string };

/** "11/28/2026" or "11/28/26" → "2026-11-28"; "" stays ""; anything else is null. */
export function toIsoDate(text: string): string | null {
  const t = text.trim();
  if (!t) return "";
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(t);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = m[3]?.length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function InquiryForm({ endpoint }: { endpoint: string }) {
  const id = useId();
  const [state, setState] = useState<State>({ status: "idle" });
  const [kind, setKind] = useState("");

  const fail = (field: Field | undefined, message: string) => setState({ status: "error", field, message });
  const errorFor = (f: Field) => (state.status === "error" && state.field === f ? state.message : null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const text = (k: string) => String(data.get(k) ?? "").trim();
    const name = text("name");
    const email = text("email");
    const phone = text("phone");
    if (!name) return fail("name", L.needName);
    if (!email && !phone) return fail("email", L.needContact);
    const date = toIsoDate(text("date"));
    if (date === null) return fail("date", L.badDate);
    const guests = text("guests");
    if (guests && !/^\d{1,4}$/.test(guests)) return fail("guests", L.badGuests);

    setState({ status: "sending" });
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          ...(email ? { email } : {}),
          ...(phone ? { phone } : {}),
          ...(date ? { date } : {}),
          ...(guests ? { guests: Number(guests) } : {}),
          ...(kind ? { type: kind } : {}),
          ...(text("message") ? { message: text("message") } : {}),
          website: text("website"),
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        field?: string;
      } | null;
      if (res.ok && body?.ok) {
        send("inquiry_submit");
        return setState({ status: "sent" });
      }
      // Ops words its own errors for the guest (a bad field, or "we have your earlier message")
      fail(
        body?.field as Field | undefined,
        (res.status === 400 || res.status === 429) && body?.error ? body.error : L.failed,
      );
    } catch {
      fail(undefined, L.failed);
    }
  }

  if (state.status === "sent") {
    return (
      <p className="inquiry__done" role="status">
        {L.sent}
      </p>
    );
  }

  const field = (
    f: Field,
    label: string,
    extra: React.InputHTMLAttributes<HTMLInputElement> = {},
    hint?: string,
  ) => {
    const err = errorFor(f);
    return (
      <div className="field" data-invalid={err ? "" : undefined}>
        <label className="field__label" htmlFor={`${id}-${f}`}>
          {label}
          {hint ? <span className="field__hint"> {hint}</span> : null}
        </label>
        <input
          id={`${id}-${f}`}
          name={f}
          className="field__input"
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `${id}-${f}-err` : undefined}
          {...extra}
        />
        {err ? (
          <p id={`${id}-${f}-err`} className="field__error">
            {err}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <form className="inquiry" onSubmit={onSubmit} noValidate>
      {field("name", L.name, { autoComplete: "name", maxLength: 120 })}
      <p className="inquiry__either">{L.either}</p>
      <div className="inquiry__pair">
        {field("email", L.email, {
          type: "email",
          autoComplete: "email",
          inputMode: "email",
          maxLength: 200,
        })}
        {field("phone", L.phone, { type: "tel", autoComplete: "tel", inputMode: "tel", maxLength: 24 })}
      </div>
      <div className="inquiry__pair">
        {field(
          "date",
          L.date,
          { inputMode: "numeric", placeholder: L.datePlaceholder, maxLength: 10 },
          L.optional,
        )}
        {field("guests", L.guests, { inputMode: "numeric", maxLength: 4 }, L.optional)}
      </div>

      <fieldset className="choices">
        <legend className="field__label">
          {L.kind} <span className="field__hint">{L.optional}</span>
        </legend>
        <div className="choices__row">
          {L.kinds.map((k) => (
            <label key={k} className="choices__item">
              <input
                type="radio"
                name="type-choice"
                value={k}
                checked={kind === k}
                onChange={() => setKind(k)}
                className="sr-only"
              />
              <span className="choice">{k}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label className="field__label" htmlFor={`${id}-message`}>
          {L.message} <span className="field__hint">{L.optional}</span>
        </label>
        <textarea id={`${id}-message`} name="message" className="field__input" rows={4} maxLength={2000} />
      </div>

      {/* a trap for bots: people never see or reach this field */}
      <div className="inquiry__trap" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state.status === "error" && !state.field ? (
        <p className="field__error" role="alert">
          {state.message}
        </p>
      ) : null}

      <button type="submit" className="btn btn--primary inquiry__send" disabled={state.status === "sending"}>
        <span className="btn__label">{state.status === "sending" ? L.sending : L.send}</span>
      </button>
    </form>
  );
}
