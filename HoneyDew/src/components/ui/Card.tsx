import { HTMLAttributes, forwardRef } from "react";

type CardVariant = "default" | "glass" | "colored";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  noPadding?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
  glass: "glass rounded-xl",
  colored: "bg-honey-100 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", noPadding = false, className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-lg ${variantStyles[variant]} ${noPadding ? "" : "p-6"} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;
