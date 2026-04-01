interface LogoIconProps {
  size?: number;
  className?: string;
}

export default function LogoIcon({ size = 32, className = "" }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer circle */}
      <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="6" />
      {/* Inner circle */}
      <circle cx="100" cy="100" r="82" fill="none" stroke="#c6c6c6" strokeWidth="3" />
      {/* Upper hourglass triangle (empty) */}
      <polygon
        points="55,44 145,44 100,100"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="miter"
      />
      {/* Lower hourglass triangle (sand) */}
      <polygon
        points="55,156 145,156 100,100"
        fill="#c6c6c6"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="miter"
      />
      {/* Small sand residue at the neck */}
      <polygon points="88,92 112,92 100,100" fill="#c6c6c6" />
      {/* Top horizontal line */}
      <line x1="55" y1="44" x2="145" y2="44" stroke="currentColor" strokeWidth="5" />
      {/* Bottom horizontal line */}
      <line x1="55" y1="156" x2="145" y2="156" stroke="currentColor" strokeWidth="5" />
    </svg>
  );
}
