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
  // spec §5.1: the sky tag on the menu after a "Not yet" at the gate
  under21: "Under 21? Tractor sodas are on the menu.",
} as const;

// Menu page interface labels (spec §6.2, §4.4). Every label below is named in the spec;
// none is marketing copy.
export const menuLabels = {
  updated: (date: string) => `Updated ${date}`,
  drinks: "Drinks",
  food: "Food",
  sections: "Menu sections",
  switchList: "Drinks or food",
  filter: "Filter",
  filters: { drinks: "Filter drinks", food: "Filter food" },
  share: "Share",
  linkCopied: "Link copied",
  matches: (n: number, show: "drinks" | "food") =>
    show === "drinks"
      ? `${n} ${n === 1 ? "beer matches" : "beers match"}`
      : `${n} ${n === 1 ? "dish matches" : "dishes match"}`,
  drinkFilters: {
    light: "Light",
    hoppy: "Hoppy",
    malty: "Malty",
    farmhouse: "Farmhouse",
    sour: "Sour",
    "under-5": "Under 5%",
  },
  foodFilters: { vegetarian: "Vegetarian", vegan: "Vegan", "kid-friendly": "Kid-friendly" },
  tags: {
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    "kid-friendly": "Kid-friendly",
    "dog-friendly": "Dog-friendly",
  },
} as const;
