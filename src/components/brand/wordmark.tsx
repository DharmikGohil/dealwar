import type { SVGProps } from "react";
import { clsx } from "clsx";

export function Mark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 52 52"
      className={clsx("mark", className)}
      {...props}
    >
      <path d="M3 3h21v46H3z" fill="currentColor" />
      <path d="M28 3h21v46H28z" fill="currentColor" />
      <path d="M12 13h6c8 0 13 5 13 13S26 39 18 39h-6V13Z" fill="var(--paper)" />
      <path d="m31 13 4 18 4-18h5l-7 26h-4l-3-12-3 12h-4l-4-15 5-3 3 10 4-18Z" fill="var(--paper)" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={clsx("wordmark", className)}>
      <Mark />
      <span>DEAL/WAR</span>
      <span className="wordmark-dot">.</span>
    </span>
  );
}
