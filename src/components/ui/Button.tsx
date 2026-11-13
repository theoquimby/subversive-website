// Buttons and links (spec §4.3). One primary action per screen; the hard offset shadow is
// reserved for it (Theo 11/13: restraint is what keeps this refined).
//   primary   — pill, CTA fill, 2 px ink outline, 3 px stamp shadow; lifts on hover, stamps on press
//   secondary — ink fill, paper text, no shadow
//   quiet     — outline only, for the third thing on a screen (chips use the same shape)
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "../graphics/Icon";

type Variant = "primary" | "secondary" | "quiet";

interface Common {
  variant?: Variant;
  icon?: IconName;
  children: ReactNode;
  className?: string;
}

type Props = Common &
  (
    | { href: string; external?: boolean; onClick?: never; type?: never; disabled?: boolean }
    | {
        href?: undefined;
        external?: never;
        onClick?: () => void;
        type?: "button" | "submit";
        disabled?: boolean;
      }
  );

export function Button(props: Props) {
  const { variant = "primary", icon, children, className } = props;
  const cls = ["btn", `btn--${variant}`, className ?? ""].filter(Boolean).join(" ");
  const inner = (
    <>
      <span className="btn__label">{children}</span>
      {props.href && props.external ? <Icon name="external" className="btn__icon" /> : null}
      {icon && !props.external ? <Icon name={icon} className="btn__icon" /> : null}
    </>
  );

  if (props.href !== undefined) {
    if (props.disabled) {
      return (
        <span className={cls} aria-disabled="true">
          {inner}
        </span>
      );
    }
    if (props.external) {
      return (
        <a className={cls} href={props.href} target="_blank" rel="noopener">
          {inner}
        </a>
      );
    }
    return (
      <Link className={cls} href={props.href}>
        {inner}
      </Link>
    );
  }
  return (
    <button className={cls} type={props.type ?? "button"} onClick={props.onClick} disabled={props.disabled}>
      {inner}
    </button>
  );
}
