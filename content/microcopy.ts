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

// Visit page and hours labels (spec §6.4, §4.9, §6.1). Interface labels named in the spec.
export const visitLabels = {
  title: "Find us",
  hours: "Hours",
  specialHours: "Special hours",
  closed: "Closed",
  kitchenTil: (t: string) => `kitchen til ${t}`,
  call: (display: string) => `Call ${display}`,
  goodToKnow: "Good to know",
  seating: "Seating",
  tent: "The tent",
  parking: "Parking",
  dogs: "Dogs",
  dogsTag: "Dogs welcome in the tent",
  giftCards: "Gift cards",
  eGiftCards: "eGift cards",
  contact: "Contact",
  bookYourBand: "Book your band",
} as const;

// Events (spec §6.3, §5.7, §4.6–4.7). Interface labels and copy named in the spec.
export const eventLabels = {
  title: "What's on",
  filters: "Filter events",
  categories: {
    all: "All",
    games: "Games",
    music: "Music",
    "trivia-movies": "Trivia & movies",
    festivals: "Festivals",
    other: "Other",
  },
  empty: "Nothing on the calendar yet.",
  over: "This one's over",
  upcoming: "Upcoming events",
  goodToKnow: "Good to know",
  tip: (t: string) => `${t} tip`,
  closedOn: (day: string, title: string) => `Closed ${day} · ${title}`,
  previous: "Previous",
  next: "Next",
  calendar: { apple: "Apple Calendar", outlook: "Outlook", google: "Google Calendar" },
  ticker: "Coming up",
} as const;

// Home (spec §6.1). Every line is the spec's own.
export const homeLabels = {
  headline: ["Beer.", "Burgers.", "Catskill."] as const,
  subline: (street: string) => `Farmhouse brewery, taproom & kitchen at ${street}.`,
  onTap: "On tap",
  fullMenu: "Full drink & food menu",
  kitchen: "From the kitchen",
  seeFood: "See the food menu",
  comingUp: "Coming up",
  whereFrom: "Where it comes from",
  ourBeer: "Our beer",
  visit: "Visit",
  facts: [
    "First come, first served",
    "Heated tent",
    "8 spots + street parking",
    "Leashed dogs outside and in the tent",
  ],
  weekdayTag: { wed: "Wing Wednesday", thu: "Rodeo Thursdays", other: "Dogs welcome in the tent" },
  mapTitle:
    "Where our ingredients come from: Catskill, with Hudson Falls, Cairo, Altamont and Hammondsport, and Livingston, where it began in 2018",
  since: "2018",
} as const;
