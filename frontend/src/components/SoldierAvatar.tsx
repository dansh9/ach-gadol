export default function SoldierAvatar({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="60" cy="60" r="60" fill="#4A6741" />

      {/* Neck */}
      <rect x="48" y="78" width="24" height="12" rx="2" fill="#D4A574" />

      {/* T-shirt / uniform collar */}
      <path
        d="M34 95C34 89 42 84 48 84H72C78 84 86 89 86 95V120H34V95Z"
        fill="#5C7A52"
      />
      {/* Collar V-neck */}
      <path
        d="M52 84L60 96L68 84"
        stroke="#4A6741"
        strokeWidth="2"
        fill="none"
      />

      {/* Face */}
      <ellipse cx="60" cy="58" rx="22" ry="26" fill="#D4A574" />

      {/* Ears */}
      <ellipse cx="37" cy="58" rx="5" ry="7" fill="#C4956A" />
      <ellipse cx="83" cy="58" rx="5" ry="7" fill="#C4956A" />

      {/* Beret */}
      <path
        d="M35 50C35 50 36 30 60 28C84 30 85 50 85 50L88 52C88 52 86 54 60 54C34 54 32 52 32 52L35 50Z"
        fill="#6B4226"
      />
      {/* Beret band */}
      <path
        d="M34 52C34 52 36 54 60 54C84 54 86 52 86 52"
        stroke="#5A3620"
        strokeWidth="2.5"
      />
      {/* Beret top fold */}
      <ellipse cx="72" cy="36" rx="10" ry="5" fill="#7A4E30" opacity="0.5" />

      {/* Eyes */}
      <ellipse cx="50" cy="56" rx="3.5" ry="3.5" fill="#2C1810" />
      <ellipse cx="70" cy="56" rx="3.5" ry="3.5" fill="#2C1810" />
      {/* Eye highlights */}
      <circle cx="51.5" cy="54.5" r="1.2" fill="white" />
      <circle cx="71.5" cy="54.5" r="1.2" fill="white" />

      {/* Eyebrows */}
      <path
        d="M44 50C46 48 52 48 55 50"
        stroke="#3D2B1F"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M65 50C68 48 74 48 76 50"
        stroke="#3D2B1F"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Nose */}
      <path
        d="M58 58C58 62 60 66 62 66C64 66 62 62 62 58"
        fill="#C4956A"
      />

      {/* Smile */}
      <path
        d="M50 70C54 75 66 75 70 70"
        stroke="#8B5E3C"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Shoulder patches */}
      <rect x="34" y="96" width="8" height="4" rx="1" fill="#4A6741" />
      <rect x="78" y="96" width="8" height="4" rx="1" fill="#4A6741" />
    </svg>
  );
}
