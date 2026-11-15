/** Purpose-based categories, in display order. */
export const categories = [
  "Site frame",
  "Layout",
  "Page openers",
  "Trust & proof",
  "Offer & pricing",
  "Media",
  "Content",
  "Feedback & overlays",
  "Filtering & choice",
  "Contact & forms"
];

/** Composition tier, shown as a badge. */
export const levels = {
  atoms: "Atom",
  molecules: "Molecule",
  components: "Component"
};

export const components = [
  {
    name: "Button",
    href: "/components/button",
    description: "Action trigger for forms and buttons.",
    category: "Content",
    level: "atoms"
  },
  {
    name: "Icon",
    href: "/components/icon",
    description: "Inline SVG symbols with consistent sizing.",
    category: "Media",
    level: "atoms"
  },
  {
    name: "Form kit",
    href: "/components/form-kit",
    description: "Form wrapper, composed FormField and every Form-* control, in tabs.",
    category: "Contact & forms",
    level: "components",
    tags: [
      "Form",
      "FormField",
      "Form-Input",
      "Form-Textarea",
      "Form-Select",
      "Form-Checkbox",
      "Form-Radio",
      "Form-Date",
      "Form-Upload",
      "Form-Help",
      "Form-Error",
      "Form-Hidden"
    ]
  },
  {
    name: "Link",
    href: "/components/link",
    description: "handles internal/external, active state, “opens in new tab” indicators",
    category: "Content",
    level: "molecules"
  },
  {
    name: "Image",
    href: "/components/image",
    description: "Image wrapper using Astro:asset with defaults",
    category: "Media",
    level: "atoms"
  },
  {
    name: "Alert",
    href: "/components/alert",
    description: "Alert box to get the attention. Dismissable and color coded",
    category: "Feedback & overlays",
    level: "molecules"
  },
  {
    name: "List",
    href: "/components/list",
    description: "Lists, unordered or ordered, with a special bullet or what not",
    category: "Content",
    level: "atoms"
  },
  {
    name: "Hero",
    href: "/components/hero",
    description: "A big fat image with a text and a cta ",
    category: "Page openers",
    level: "components"
  },
  {
    name: "Rotator",
    href: "/components/rotator",
    description: "text rotating animation",
    category: "Media",
    level: "molecules",
    tags: ["carousel", "slider"]
  },
  {
    name: "LocaleSwitch",
    href: "/components/locale-switch",
    description: "Switch language in i18n websites",
    category: "Site frame",
    level: "molecules"
  },
  {
    name: "PhotoRoll",
    href: "/components/photo-roll",
    description: "A component to display images and scroll through them",
    category: "Media",
    level: "components",
    tags: ["gallery", "carousel"]
  },
  {
    name: "Map",
    href: "/components/map",
    description: "Display a google map centered on a google business",
    category: "Media",
    level: "components",
    tags: ["location", "address"]
  },
  {
    name: "Accordion",
    href: "/components/accordion",
    description: "a button that collapse blocks and shit",
    category: "Content",
    level: "molecules"
  },
  {
    name: "ComparisonSlider",
    href: "/components/comparisonslider",
    description: "Compare between 2 images or blocks",
    category: "Media",
    level: "molecules",
    tags: ["before after"]
  },
  {
    name: "GoogleReviews",
    href: "/components/googlereviews",
    description: "Add Google reviews on a page.",
    category: "Trust & proof",
    level: "components",
    tags: ["testimonials"]
  },
  {
    name: "Pipeda",
    href: "/components/pipeda",
    description: "PIPEDA-oriented cookie banner and privacy-page settings component",
    category: "Contact & forms",
    level: "components",
    tags: ["privacy", "consent", "cookies"]
  },
  {
    name: "StarRating",
    href: "/components/star-rating",
    description: "A star rating system in pure CSS",
    category: "Trust & proof",
    level: "molecules"
  },
  {
    name: "Tooltip",
    href: "/components/tooltip",
    description: "A tooltip",
    category: "Feedback & overlays",
    level: "atoms",
    tags: ["hint"]
  },
  {
    name: "Modal",
    href: "/components/modal",
    description: "A modal component",
    category: "Feedback & overlays",
    level: "components",
    tags: ["dialog", "popup"]
  },
  {
    name: "Band",
    href: "/components/band",
    description: "Full-width section: spacing, width and background tone.",
    category: "Layout",
    level: "components"
  },
  {
    name: "Breadcrumb",
    href: "/components/breadcrumb",
    description: "Trail of links ending on the current page.",
    category: "Site frame",
    level: "molecules"
  },
  {
    name: "CardGrid",
    href: "/components/cardgrid",
    description: "Comparable items in 2 or 3 columns, with or without links.",
    category: "Layout",
    level: "components"
  },
  {
    name: "CtaBand",
    href: "/components/ctaband",
    description: "One action with a large title, once per page.",
    category: "Page openers",
    level: "components",
    tags: ["call to action"]
  },
  {
    name: "DataTable",
    href: "/components/datatable",
    description: "Real table with caption, headers and a scrollable region.",
    category: "Content",
    level: "components",
    tags: ["table"]
  },
  {
    name: "Facts",
    href: "/components/facts",
    description: "A sentence that answers on its own, then key facts.",
    category: "Trust & proof",
    level: "components",
    tags: ["stats", "numbers"]
  },
  {
    name: "Faq",
    href: "/components/faq",
    description: "Questions and answers with native details.",
    category: "Content",
    level: "components",
    tags: ["questions"]
  },
  {
    name: "PageHero",
    href: "/components/pagehero",
    description: "Top of a page with its only h1.",
    category: "Page openers",
    level: "components"
  },
  {
    name: "Plans",
    href: "/components/plans",
    description: "Pricing cards, with a CSS-only payment switch.",
    category: "Offer & pricing",
    level: "components",
    tags: ["pricing", "tiers"]
  },
  {
    name: "Proof",
    href: "/components/proof",
    description: "Experience and clients.",
    category: "Trust & proof",
    level: "components",
    tags: ["case study", "before after"]
  },
  {
    name: "Section",
    href: "/components/section",
    description: "Basic content block: title, text, list or image.",
    category: "Layout",
    level: "components"
  },
  {
    name: "Steps",
    href: "/components/steps",
    description: "Ordered sequence with large numbers.",
    category: "Content",
    level: "components",
    tags: ["process", "how it works"]
  },
  {
    name: "SiteHeader",
    href: "/components/siteheader",
    description: "Logo, main menu, language and one button. Menu panel on phones.",
    category: "Site frame",
    level: "components"
  },
  {
    name: "SiteFooter",
    href: "/components/sitefooter",
    description: "Contact details, link columns and legal line.",
    category: "Site frame",
    level: "components"
  },
  {
    name: "Tag",
    href: "/components/tag",
    description: "Small label for a status.",
    category: "Content",
    level: "atoms"
  },
  {
    name: "Card",
    href: "/components/card",
    description: "Generic card: photo, tag, title, text, meta line; one link.",
    category: "Layout",
    level: "molecules"
  },
  {
    name: "FilterBar",
    href: "/components/filterbar",
    description: "Toggle filters for any list on the page, with a shareable URL.",
    category: "Filtering & choice",
    level: "molecules",
    tags: ["filter", "search"]
  },
  {
    name: "GoogleRating",
    href: "/components/googlerating",
    description: "Overall Google rating: badge, inline or mini.",
    category: "Trust & proof",
    level: "molecules"
  },
  {
    name: "TableOfContents",
    href: "/components/tableofcontents",
    description: '"On this page" list, sticky on desktop, folded on phones.',
    category: "Site frame",
    level: "molecules",
    tags: ["toc", "anchors"]
  },
  {
    name: "ContactCard",
    href: "/components/contactcard",
    description: "Phone, email, office and hours with an open-now status.",
    category: "Contact & forms",
    level: "components",
    tags: ["phone", "email", "hours"]
  },
  {
    name: "Lightbox",
    href: "/components/lightbox",
    description: "Full-screen photo viewer with arrows, swipe and captions.",
    category: "Media",
    level: "components",
    tags: ["gallery", "zoom"]
  },
  {
    name: "Review",
    href: "/components/review",
    description: "One customer review: full, compact, with rating or video.",
    category: "Trust & proof",
    level: "components",
    tags: ["testimonial"]
  },
  {
    name: "StepByStepWizard",
    href: "/components/stepbystepwizard",
    description: "One question at a time, progress bar, summary and result.",
    category: "Filtering & choice",
    level: "components",
    tags: ["quote", "multi-step"]
  },
  {
    name: "StickyActions",
    href: "/components/stickyactions",
    description: "Fixed bottom bar on phones: main action and call.",
    category: "Site frame",
    level: "components",
    tags: ["mobile", "call", "cta"]
  },
  {
    name: "TrustBar",
    href: "/components/trustbar",
    description: "Two to six short guarantees with icons.",
    category: "Trust & proof",
    level: "components"
  },
  {
    name: "PriceTicket",
    href: "/components/priceticket",
    description: "Two or three prices side by side, one highlighted.",
    category: "Offer & pricing",
    level: "molecules",
    tags: ["price"]
  },
  {
    name: "SegmentedControl",
    href: "/components/segmentedcontrol",
    description: "2 to 4 exclusive choices that change how a zone looks.",
    category: "Filtering & choice",
    level: "molecules",
    tags: ["toggle", "tabs"]
  },
  {
    name: "Marquee",
    href: "/components/marquee",
    description: "Slow scrolling band of text, with a pause button.",
    category: "Media",
    level: "components",
    tags: ["ticker", "logos"]
  },
  {
    name: "NoticeBar",
    href: "/components/noticebar",
    description: "Thin band above the header for a site-wide notice.",
    category: "Site frame",
    level: "components",
    tags: ["announcement", "banner"]
  },
  {
    name: "MenuLine",
    href: "/components/menuline",
    description: "Printed-menu list: name, dotted leader, price, description.",
    category: "Offer & pricing",
    level: "molecules",
    tags: ["restaurant", "menu"]
  },
  {
    name: "OptionBuilder",
    href: "/components/optionbuilder",
    description: "Pick options in groups, see a live total, order from a sticky bar.",
    category: "Offer & pricing",
    level: "components",
    tags: ["configurator", "restaurant"]
  },
  {
    name: "VisibleCaption",
    href: "/components/visiblecaption",
    description: "Photo caption or map legend that is always visible.",
    category: "Media",
    level: "molecules",
    tags: ["figure", "legend"]
  },
  {
    name: "StatsCounter",
    href: "/components/statscounter",
    description: "Key numbers that count up once when they scroll into view.",
    category: "Trust & proof",
    level: "components",
    tags: ["numbers", "stats", "counter"]
  },
  {
    name: "LogoCloud",
    href: "/components/logocloud",
    description: "Client or partner logos in a calm grid, greyed until hover.",
    category: "Trust & proof",
    level: "components",
    tags: ["logos", "clients", "partners"]
  },
  {
    name: "Toast",
    href: "/components/toast",
    description: "Short message that slides in, is announced, and leaves by itself.",
    category: "Feedback & overlays",
    level: "molecules",
    tags: ["notification", "snackbar", "flash"]
  },
  {
    name: "BentoGrid",
    href: "/components/bentogrid",
    description: "Tiles of different sizes in one tight grid: services, features, highlights.",
    category: "Layout",
    level: "components",
    tags: ["bento", "grid", "features", "tiles"]
  },
  {
    name: "Timeline",
    href: "/components/timeline",
    description: "Dated milestones: company history, project diary.",
    category: "Content",
    level: "components",
    tags: ["history", "milestones", "chronology"]
  },
  {
    name: "TeamSection",
    href: "/components/teamsection",
    description: "The people behind the business, with photo, role and contacts.",
    category: "Trust & proof",
    level: "components",
    tags: ["team", "staff", "people", "about"]
  },
  {
    name: "Tabs",
    href: "/components/tabs",
    description: "Switch between a few related panels in place; #id opens a tab.",
    category: "Content",
    level: "molecules",
    tags: ["tablist", "panels"]
  },
  {
    name: "VideoFacade",
    href: "/components/videofacade",
    description: "YouTube or Vimeo that loads nothing until the visitor presses play.",
    category: "Media",
    level: "molecules",
    tags: ["video", "youtube", "vimeo", "embed", "lite"]
  },
  {
    name: "AnnouncementPill",
    href: "/components/announcementpill",
    description: "Small rounded line above a hero heading that points to news.",
    category: "Page openers",
    level: "atoms",
    tags: ["badge", "banner", "news", "pill"]
  },
  {
    name: "SlotPicker",
    href: "/components/slotpicker",
    description: "Pick a day, then a time, for an appointment. A plain form field.",
    category: "Contact & forms",
    level: "components",
    tags: ["appointment", "booking", "calendar", "schedule", "time"]
  }
];

/**
 * Tabs of the merged Form kit page. `slug` is the former standalone page,
 * which now redirects to /components/form-kit#<id>.
 */
export const formKitTabs = [
  {
    id: "form",
    name: "Form",
    description: "Form wrapper that manages submit behavior and errors.",
    slug: "form",
    level: "components"
  },
  {
    id: "field",
    name: "FormField",
    description: "Composed, fully-wired form field (label + control + help + error)",
    slug: "formfield",
    level: "components"
  },
  {
    id: "input",
    name: "Form-Input",
    description: "Text input field with label and basic states.",
    slug: "form-input",
    level: "atoms"
  },
  {
    id: "textarea",
    name: "Form-Textarea",
    description: "Multiline textarea with label and states.",
    slug: "form-textarea",
    level: "atoms"
  },
  {
    id: "select",
    name: "Form-Select",
    description: "Single-select dropdown with label and states.",
    slug: "form-select",
    level: "atoms"
  },
  {
    id: "checkbox",
    name: "Form-Checkbox",
    description: "Checkbox styled as a toggle with configurable position and colors.",
    slug: "form-checkbox",
    level: "atoms"
  },
  {
    id: "radio",
    name: "Form-Radio",
    description: "Stylish radio buttons with layout and color options.",
    slug: "form-radio",
    level: "atoms"
  },
  {
    id: "date",
    name: "Form-Date",
    description: "Native date input with label.",
    slug: "form-date",
    level: "atoms"
  },
  {
    id: "upload",
    name: "Form-Upload",
    description: "Image/file upload input with label and limits.",
    slug: "form-upload",
    level: "atoms"
  },
  {
    id: "help",
    name: "Form-Help",
    description: "Helper text for form fields with aria support.",
    slug: "form-help",
    level: "atoms"
  },
  {
    id: "error",
    name: "Form-Error",
    description: "Error text for form fields with alert semantics.",
    slug: "form-error",
    level: "atoms"
  },
  {
    id: "hidden",
    name: "Form-Hidden",
    description: "Hidden input for posting fixed values.",
    slug: "form-hidden",
    level: "atoms"
  }
];
