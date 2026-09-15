import type * as React from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  wordmarkClassName?: string;
  iconClassName?: string;
}

const sizeMap = {
  sm: { icon: "size-6", text: "text-base font-semibold" },
  md: { icon: "size-8", text: "text-xl font-bold" },
  lg: { icon: "size-10", text: "text-2xl font-bold" },
  xl: { icon: "size-12", text: "text-3xl font-bold" },
};

export function SyncDocketIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8 shrink-0", className)}
      aria-label="SyncDocket icon"
      {...props}
    >
      <title>SyncDocket</title>
      <g>
        <path
          className="fill-primary"
          style={{ strokeWidth: 1.17574 }}
          d="m 236.8614,70.020867 h -0.0195 l -0.66624,183.318763 c -0.061,16.77198 8.02466,32.52956 21.68508,42.26075 l 266.53381,189.86903 c 4.27016,3.04191 9.38255,4.67666 14.6254,4.67666 h 101.87453 c 0.42501,0 0.82208,-0.0609 1.18785,-0.17203 3.70702,-1.12686 -2.08722,-9.18996 -5.99851,-11.97622 L 365.35479,285.14026 c -4.45177,-3.17128 -7.08675,-8.30652 -7.06682,-13.77231 l 0.14493,-39.75133 c 0.0152,-4.17411 3.40329,-7.54985 7.57743,-7.54985 h 143.92179 c 5.1275,0 9.28416,-4.15667 9.28414,-9.28417 l -4.9e-4,-143.044007 c -3e-5,-8.682973 -7.03898,-15.721898 -15.72195,-15.721899 H 250.86634 c -7.73441,2e-6 -14.00451,6.269758 -14.00494,14.004173 z"
          transform="matrix(1.0583805,0,-0.74094199,0.70037661,-20.047841,-9.232782)"
        />
        <path
          className="fill-primary"
          style={{ strokeWidth: 1.17574 }}
          d="m 236.8614,70.020867 h -0.0195 l -0.66624,183.318763 c -0.061,16.77198 8.02466,32.52956 21.68508,42.26075 l 266.53381,189.86903 c 4.27016,3.04191 9.38255,4.67666 14.6254,4.67666 h 101.87453 c 0.42501,0 0.82208,-0.0609 1.18785,-0.17203 3.70702,-1.12686 -2.08722,-9.18996 -5.99851,-11.97622 L 365.35479,285.14026 c -4.45177,-3.17128 -7.08675,-8.30652 -7.06682,-13.77231 l 0.14493,-39.75133 c 0.0152,-4.17411 3.40329,-7.54985 7.57743,-7.54985 h 143.92179 c 5.1275,0 9.28416,-4.15667 9.28414,-9.28417 l -4.9e-4,-143.044007 c -3e-5,-8.682973 -7.03898,-15.721898 -15.72195,-15.721899 H 250.86634 c -7.73441,2e-6 -14.00451,6.269758 -14.00494,14.004173 z"
          transform="matrix(-1.0583805,0,0.74094199,-0.70037661,530.04781,519.23278)"
        />
      </g>
    </svg>
  );
}

export function Logo({
  size = "md",
  showWordmark = true,
  className,
  wordmarkClassName,
  iconClassName,
  ...props
}: LogoProps) {
  const currentSize = sizeMap[size];

  return (
    <div className={cn("inline-flex select-none items-center gap-2.5", className)} {...props}>
      <SyncDocketIcon className={cn(currentSize.icon, iconClassName)} />
      {showWordmark && (
        <span
          className={cn(
            "font-bold text-foreground tracking-tight",
            currentSize.text,
            wordmarkClassName,
          )}
        >
          Sync<span className="text-primary">Docket</span>
        </span>
      )}
    </div>
  );
}
