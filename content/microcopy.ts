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
  close: "Close",
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
  photos: "Photos of the taproom",
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
// Private-event inquiry form: interface labels and its own messages (Ops words the
// errors it sends back; these are the ones the form raises itself)
export const inquiryLabels = {
  title: "Private events",
  link: "Book a private event",
  name: "Name",
  email: "Email",
  phone: "Phone",
  either: "Email or phone. One is enough.",
  date: "Date",
  datePlaceholder: "MM/DD/YYYY",
  guests: "Guests",
  kind: "Kind of event",
  kinds: ["Birthday", "Rehearsal dinner", "Corporate", "Buyout", "Other"],
  message: "Anything else",
  optional: "(optional)",
  send: "Send inquiry",
  sending: "Sending",
  sent: "Thanks. We have your inquiry and will be in touch.",
  needName: "Please add your name.",
  needContact: "Please add an email or a phone number.",
  badDate: "Please write the date as MM/DD/YYYY.",
  badGuests: "Please give the number of guests as a number.",
  failed: "Something went wrong. Please email or call us instead.",
} as const;

// About page: interface labels
export const aboutLabels = { title: "About", founders: "Founders" } as const;

// Our beer's list of beers (Theo, 2026-11-18: "beer library or history or something so
// people don't think they are all available now"). Beers on the menu carry the "On tap
// now" mark; the others are beers Max has sent labels for, with only what the label says.
export const libraryLabels = {
  title: "Beer library",
  onTap: "On tap now",
  notOnTap: "Not on tap now",
} as const;

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
  // the facts strip under the first screen: interface labels
  facts: { today: "Today", allHours: "All hours", findUs: "Find us", call: "Call" },
  waysLabel: "Pages",
  // the link in a supplier's detail view: an interface label
  supplierSite: "Their website",
  weekdayTag: { wed: "Wing Wednesday", thu: "Rodeo Thursdays", other: "Dogs welcome in the tent" },
  // the tap-list glass on the first screen: interface labels
  tap: {
    // the glass itself is a button too; this is its name
    pour: "Tap the glass to pour the next beer",
    previous: "Previous beer",
    next: "Pour the next beer",
    onTheMenu: "On the menu",
  },
  mapTitle:
    "Where our ingredients come from: Catskill, with Hudson Falls, Cairo, Altamont and Hammondsport, and Livingston, where it began in 2018",
  since: "2018",
} as const;

// Our beer: the drawing of how a batch is brewed (2026-11-16). Station names only. The
// drawing shows malting at Theo's request (2026-11-16): those words appear in it and
// nowhere else on the site (spec O10).
export const brewLabels = {
  title: "How it's made",
  aria: (beer: string) =>
    `How ${beer} is made, from New York grain through malting, mashing and the boil to kegs and cans`,
  nowBrewing: "Now brewing",
  change: "Change",
  choose: "Choose a beer",
  steps: "Steps",
  brewing: "Brewing",
  malt: "Malt",
  grain: "Grain",
  hops: "Hops",
  water: "Water",
  yeast: "Yeast",
  malting: "Malting",
  steep: "Steep",
  germinate: "Germinate",
  kiln: "Kiln",
  mill: "Mill",
  mash: "Mash",
  runoff: "Run-off",
  boil: "Boil",
  ferment: "Ferment",
  out: "Kegs & cans",
  again: "Brew another",
  seeHow: "See how it's brewed",
} as const;

// Ordering from the site (2026-11-15). Interface labels and the messages the order sheet
// raises itself; written plainly, to be read aloud by Max before ordering is switched on.
export const orderLabels = {
  add: "Add to order",
  added: "Added to your order.",
  yourOrder: "Your order",
  viewOrder: (n: number) => `Your order · ${n}`,
  empty: "Nothing in your order yet.",
  close: "Close",
  chooseOne: "Choose one",
  choose: (n: number) => (n === 1 ? "choose 1" : `choose ${n}`),
  upTo: (n: number) => `up to ${n}`,
  quantity: "Quantity",
  fewer: "One fewer",
  more: "One more",
  remove: (name: string) => `Remove ${name}`,
  tax: "Tax",
  total: "Total",
  pickup: (minutes: number) => `Pickup at the taproom, ready in about ${minutes} minutes.`,
  name: "Name for the order",
  phone: "Phone",
  card: "Card",
  pay: (total: string) => `Pay ${total}`,
  payPlain: "Pay",
  paying: "Paying",
  closed: "The kitchen is closed, so orders can't be placed right now.",
  thanks: (name: string) => `Thanks, ${name}. Your order is in.`,
  ready: (minutes: number) => `It will be ready in about ${minutes} minutes at the taproom.`,
  reference: (ref: string) => `Order ${ref}`,
  needName: "Please add a name for the order.",
  needPhone: "Please add a phone number we can reach you on.",
  declined: "The card was declined. Please try another card.",
  cardProblem: "Please check the card details and try again.",
  failed: "Something went wrong. Please call us before trying again.",
  unavailable: (name: string) => `${name} can't be ordered right now. Please remove it.`,
  sandbox: "Test mode: no real payment is taken.",
} as const;

// The row of photographs in Home's Visit band and the large view each one opens
// (2026-11-16): interface labels.
export const galleryLabels = {
  group: "Photos of the brewery",
  open: (alt: string) => `Open photo: ${alt}`,
  all: (n: number) => `All ${n} photos`,
  close: "Close",
  previous: "Previous photo",
  next: "Next photo",
} as const;

// The announcement band under the header (Ops → announcements). Labels only; every line
// in the band is Max's, from Ops.
export const announceLabels = {
  // label: the band's landmark name for screen readers
  region: "Announcements",
  // label: the close button on each line
  dismiss: "Dismiss",
} as const;

// A featured event's own page (Ops → event.page). Labels only; the sections, times and
// links are Max's, from Ops.
export const eventPageLabels = {
  // label: the heading over the night's running order
  schedule: "Schedule",
  // label: the heading over the event's links
  links: "Links",
} as const;

// The Instagram feed (InstagramFeed.tsx). Labels only.
export const socialLabels = {
  // label: the feed's landmark name and each post's link name
  instagram: "Instagram",
  // label: alt text for a post with no caption
  post: "A post on Instagram",
} as const;
