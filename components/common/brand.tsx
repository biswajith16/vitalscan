export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="14" fill="currentColor" />
      <path
        d="M16 31c-2-3-3-6-3-10 0-7 4-12 11-12s11 5 11 12c0 9-5 17-11 18-3-1-5-2-7-4"
        stroke="#B5E9DD"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8 25h11l2.5-5.5 3.5 10 3-6.5h12"
        stroke="white"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function FaceIllustration() {
  return (
    <svg
      viewBox="0 0 300 290"
      fill="none"
      className="face-illustration"
      aria-hidden="true"
    >
      <circle cx="150" cy="145" r="126" stroke="currentColor" opacity=".1" />
      <circle
        cx="150"
        cy="145"
        r="100"
        stroke="currentColor"
        opacity=".12"
        strokeDasharray="3 7"
      />
      <path
        d="M104 57h-22a12 12 0 0 0-12 12v22m126-34h22a12 12 0 0 1 12 12v22M70 200v22a12 12 0 0 0 12 12h22m92 0h22a12 12 0 0 0 12-12v-22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M98 128c-4-42 13-71 52-71s56 29 52 71l-5 48c-4 34-26 61-47 64-21-3-43-30-47-64z"
        fill="currentColor"
        fillOpacity=".035"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity=".8"
      />
      <path
        d="M119 130h13m36 0h13m-31 2-7 28h14m-26 25q19 12 38 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".6"
      />
      <path
        d="M107 102l43-18 43 18-10 70-33 37-33-37zM107 102l76 70m10-70-76 70m0 0h66m-33-88v125"
        stroke="currentColor"
        opacity=".12"
      />
      {[
        [107, 102],
        [150, 84],
        [193, 102],
        [117, 172],
        [183, 172],
        [150, 209],
      ].map(([x, y]) => (
        <circle
          key={`${x}${y}`}
          cx={x}
          cy={y}
          r="3"
          fill="currentColor"
          opacity=".7"
        />
      ))}
      <path
        d="M46 153h61l12-15 13 31 18-50 20 65 13-31h71"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
