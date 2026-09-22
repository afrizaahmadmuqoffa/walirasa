"use client";

import * as React from "react";
import { cn } from "cn";

/**
 * Tombol sensori-friendly untuk area anak:
 * - touch target minimal 48x48px (min-h-12/min-w-12), varian lebih besar
 *   dipakai untuk grid AAC (h-28 dsb). Default 'lg' = 56px.
 * - palet #A2C5D9 / #B5EAD7 / #2C4A5E
 * - transisi 200–300ms ease-out, tanpa animasi berkedip
 */
const colorMap = {
  primary: "bg-[#2C4A5E] text-white hover:bg-[#2C4A5E]/90",
  secondary: "bg-[#A2C5D9] text-[#2C4A5E] hover:bg-[#A2C5D9]/90",
  accent: "bg-[#B5EAD7] text-[#2C4A5E] hover:bg-[#B5EAD7]/90",
  muted: "bg-[#E9F1F5] text-[#2C4A5E] hover:bg-[#E9F1F5]/80",
} as const;

const sizeMap = {
  sm: "min-h-12 min-w-12 px-3 text-base",
  lg: "min-h-14 min-w-14 px-5 text-lg",
  xl: "min-h-24 min-w-24 px-4 text-xl",
} as const;

export type SensoryButtonProps = {
  color?: keyof typeof colorMap;
  size?: keyof typeof sizeMap;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const SensoryButton = React.forwardRef<HTMLButtonElement, SensoryButtonProps>(
  ({ className, color = "secondary", size = "lg", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl font-semibold",
          "transition-[background-color,transform,filter] duration-300 ease-out",
          "active:scale-[0.97]",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A2C5D9]/50",
          "disabled:pointer-events-none disabled:opacity-50",
          "[&_svg]:pointer-events-none [&_svg]:shrink-0",
          colorMap[color],
          sizeMap[size],
          className
        )}
        {...props}
      />
    );
  }
);

SensoryButton.displayName = "SensoryButton";