import { HTMLAttributes } from "react";

type BadgeVariant = "honey" | "dew" | "pop" | "mint" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  honey: "bg-honey-200 text-honey-600 border-honey-500",
  dew: "bg-dew-200 text-dew-600 border-dew-500",
  pop: "bg-pop-200 text-pop-600 border-pop-500",
  mint: "bg-mint-200 text-green-700 border-mint-500",
  neutral: "bg-gray-200 text-gray-700 border-gray-400",
};

export default function Badge({ variant = "honey", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-black border-2 rounded-full ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
