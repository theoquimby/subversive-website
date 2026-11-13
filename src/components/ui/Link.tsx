// Site link (plan M2 item 2): next/link that tags in-site navigations "nav-forward", so the
// page wipe runs up and to the right. Browser back/forward carry no type and get the
// mirrored wipe (PageWipe maps the untyped case), with no history bookkeeping.
import NextLink from "next/link";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof NextLink>, "transitionTypes">;

export function Link(props: Props) {
  return <NextLink {...props} transitionTypes={["nav-forward"]} />;
}
