// Spec §7.1 microcopy set, used exactly. Plan §4: no sentence is typed into JSX.
// Additions that are interface labels rather than copy are marked "label".
export const microcopy = {
  orderPickup: "Order pickup",
  seeTheMenu: "See the menu",
  directions: "Directions",
  allEvents: "All events",
  addToCalendar: "Add to calendar",
  openNow: "Open now",
  tonight: "Tonight",
  closedTuesdays: "Closed Tuesdays",
  emailUs: "Email us",
  onTheList: "You're on the list.",
  somethingSpilled: "Something spilled. Try again.",
  // label: the skip link (spec §9.2)
  skipToContent: "Skip to content",
} as const;
