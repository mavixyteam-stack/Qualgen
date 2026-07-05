/** Minimal stroke icon set — 24px viewBox, 2px round strokes. */

type IconProps = { size?: number; className?: string; strokeWidth?: number };

function base(props: IconProps) {
  return {
    width: props.size ?? 18,
    height: props.size ?? 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: props.strokeWidth ?? 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: props.className,
    "aria-hidden": true,
  };
}

export const IconGrid = (p: IconProps) => (
  <svg {...base(p)}><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>
);
export const IconTarget = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>
);
export const IconRocket = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 15.5c4.5-2.2 7-6.2 7-11 0-.3-.2-.5-.5-.5-4.8 0-8.8 2.5-11 7"/><path d="M7.5 11 4 13.5c2 .5 3.5 1 5 3s2.5 3 3 5L14.5 18"/><path d="M5.5 18.5c-.8.8-1.2 2.3-1.4 3.4 1.1-.2 2.6-.6 3.4-1.4"/><circle cx="14.5" cy="9.5" r="1.6"/></svg>
);
export const IconCoin = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M9.5 9.8c0-1 1.1-1.7 2.5-1.7s2.5.7 2.5 1.7c0 2.6-5 1.7-5 4.3 0 1 1.1 1.8 2.5 1.8s2.5-.8 2.5-1.8"/></svg>
);
export const IconGear = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8 13 5a7.4 7.4 0 0 1 2.4 1L17.8 5l1.7 1.7-1 2.4a7.4 7.4 0 0 1 1 2.4l2.2 1v2.4l-2.2 1a7.4 7.4 0 0 1-1 2.4l1 2.4-1.7 1.7-2.4-1a7.4 7.4 0 0 1-2.4 1l-1 2.2h-2.4l-1-2.2a7.4 7.4 0 0 1-2.4-1l-2.4 1L4.1 19l1-2.4a7.4 7.4 0 0 1-1-2.4l-2.3-1v-2.4l2.3-1a7.4 7.4 0 0 1 1-2.4l-1-2.4L5.8 3.6l2.4 1a7.4 7.4 0 0 1 2.4-1l1-2.2z" opacity=".9"/></svg>
);
export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.8-3.8"/></svg>
);
export const IconSpark = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3.5c.7 3.9 2.6 5.8 6.5 6.5-3.9.7-5.8 2.6-6.5 6.5-.7-3.9-2.6-5.8-6.5-6.5 3.9-.7 5.8-2.6 6.5-6.5Z"/><path d="M18.5 15.5c.35 1.9 1.3 2.85 3 3.2-1.7.35-2.65 1.3-3 3-.35-1.7-1.3-2.65-3-3 1.7-.35 2.65-1.3 3-3.2Z" opacity=".7"/></svg>
);
export const IconMail = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="m4.5 8 6.3 4.6a2 2 0 0 0 2.4 0L19.5 8"/></svg>
);
export const IconChat = (p: IconProps) => (
  <svg {...base(p)}><path d="M20.5 12a8.5 8.5 0 1 0-3.4 6.8l3.4.9-.9-3.3A8.4 8.4 0 0 0 20.5 12Z"/><path d="M8.5 11h7M8.5 14.2h4.5"/></svg>
);
export const IconFlame = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 21c3.9 0 6.5-2.5 6.5-6.2 0-2.7-1.7-4.6-3.2-6.4C13.9 6.7 13 5.2 13 3c-3.5 1.6-4.6 4.5-4.3 7-1-.3-1.7-1-2.1-2.2-1.3 1.5-2.1 3.4-2.1 5.2C4.5 18 7.4 21 12 21Z"/><path d="M12 21c2 0 3.3-1.4 3.3-3.3 0-1.7-1.2-2.7-2.2-3.9-.5.9-2 1.6-2.2 3-.9-.2-1.3-.7-1.5-1.4-.5.7-.7 1.5-.7 2.2 0 2 1.4 3.4 3.3 3.4Z" opacity=".65"/></svg>
);
export const IconBrain = (p: IconProps) => (
  <svg {...base(p)}><path d="M9.5 4.5A2.7 2.7 0 0 0 6 7a3 3 0 0 0-2 4.4A3.2 3.2 0 0 0 5.5 17c.3 1.6 1.6 2.5 3 2.5 1.7 0 3-1.3 3-3V7.2c0-1.5-.8-2.7-2-2.7Z"/><path d="M14.5 4.5A2.7 2.7 0 0 1 18 7a3 3 0 0 1 2 4.4 3.2 3.2 0 0 1-1.5 5.6c-.3 1.6-1.6 2.5-3 2.5-1.7 0-3-1.3-3-3V7.2c0-1.5.8-2.7 2-2.7Z"/></svg>
);
export const IconUsers = (p: IconProps) => (
  <svg {...base(p)}><circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.6-3 2.8-4.7 5.5-4.7s4.9 1.7 5.5 4.7"/><circle cx="16.8" cy="9.5" r="2.5"/><path d="M16.5 14.6c2.2.2 3.7 1.7 4.2 4"/></svg>
);
export const IconChart = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 4v14.5a1.5 1.5 0 0 0 1.5 1.5H20"/><path d="m7.5 14.5 3.4-4 3 2.5 4.3-5.5"/></svg>
);
export const IconBolt = (p: IconProps) => (
  <svg {...base(p)}><path d="M13.5 3 5.5 13.5h5l-1 7.5 8-10.5h-5l1-7.5Z"/></svg>
);
export const IconArrowUpRight = (p: IconProps) => (
  <svg {...base(p)}><path d="M7 17 17 7M9 7h8v8"/></svg>
);
export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14"/></svg>
);
export const IconX = (p: IconProps) => (
  <svg {...base(p)}><path d="M18 6 6 18M6 6l12 12"/></svg>
);
export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>
);
export const IconEye = (p: IconProps) => (
  <svg {...base(p)}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>
);
export const IconUpload = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 16V4.5M7.5 8.5 12 4l4.5 4.5"/><path d="M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"/></svg>
);
export const IconPhone = (p: IconProps) => (
  <svg {...base(p)}><path d="M5.5 3.5h3l1.7 4.3-2 1.6a12.5 12.5 0 0 0 6.4 6.4l1.6-2 4.3 1.7v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.5 5.7a2 2 0 0 1 2-2.2Z"/></svg>
);
export const IconLinkedIn = (p: IconProps) => (
  <svg {...base(p)}><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 10.5V17M8 7.6v.1M12 17v-3.8c0-1.5 1-2.7 2.4-2.7S17 11.7 17 13.2V17"/></svg>
);
export const IconWhatsApp = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5Z"/><path d="M9 8.8c-.3 2.7 3.4 6.4 6.2 6.2l.6-1.6-2-1-1 .8c-.9-.4-1.6-1.1-2-2l.8-1-1-2Z"/></svg>
);
export const IconLogout = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 20.5H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h3"/><path d="m15 16 4-4-4-4M19 12H9.5"/></svg>
);
export const IconBell = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13.5 6 9.5Z"/><path d="M10 18.5a2.1 2.1 0 0 0 4 0"/></svg>
);
export const IconClipboard = (p: IconProps) => (
  <svg {...base(p)}><rect x="5" y="4.5" width="14" height="16.5" rx="3"/><path d="M9 3h6v3H9zM9 11h6M9 15h4"/></svg>
);
export const IconGlobe = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5s1.2-6.2 3.6-8.5Z"/></svg>
);
export const IconTrash = (p: IconProps) => (
  <svg {...base(p)}><path d="M4.5 6.5h15M9.5 6V4.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V6M6.5 6.5l.8 12.1a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12.1"/></svg>
);
export const IconCompass = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>
);
