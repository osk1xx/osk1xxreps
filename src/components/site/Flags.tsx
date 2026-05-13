export const FlagGB = ({ className = "h-4 w-6 rounded-sm" }: { className?: string }) => (
  <svg viewBox="0 0 60 36" className={className} aria-hidden>
    <clipPath id="t-gb"><path d="M30,18 h30 v18 z v18 h-30 z h-30 v-18 z v-18 h30 z" /></clipPath>
    <rect width="60" height="36" fill="#012169" />
    <path d="M0,0 L60,36 M60,0 L0,36" stroke="#fff" strokeWidth="6" />
    <path d="M0,0 L60,36 M60,0 L0,36" stroke="#C8102E" strokeWidth="3" clipPath="url(#t-gb)" />
    <path d="M30,0 v36 M0,18 h60" stroke="#fff" strokeWidth="10" />
    <path d="M30,0 v36 M0,18 h60" stroke="#C8102E" strokeWidth="6" />
  </svg>
);

export const FlagPL = ({ className = "h-4 w-6 rounded-sm" }: { className?: string }) => (
  <svg viewBox="0 0 60 36" className={className} aria-hidden>
    <rect width="60" height="18" fill="#fff" />
    <rect y="18" width="60" height="18" fill="#DC143C" />
  </svg>
);
