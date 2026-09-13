import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

export interface CardProps extends Omit<
  HTMLMotionProps<"div">,
  "ref" | "children"
> {
  variant?: "default" | "glass" | "outline" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
  children?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "default",
      padding = "md",
      interactive = false,
      className = "",
      ...props
    },
    ref,
  ) => {
    const baseStyles = "rounded-2xl overflow-hidden";

    const variants = {
      default: "bg-white border border-slate-100 shadow-sm",
      glass: "glass-panel",
      outline: "bg-transparent border-2 border-slate-200",
      elevated: "bg-white shadow-lg border border-slate-50",
    };

    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    const interactiveStyles = interactive
      ? "cursor-pointer hover:shadow-md transition-shadow"
      : "";

    const combinedClasses = `${baseStyles} ${variants[variant]} ${paddings[padding]} ${interactiveStyles} ${className}`;

    return (
      <motion.div
        ref={ref}
        className={combinedClasses}
        whileHover={interactive ? { y: -4 } : {}}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

Card.displayName = "Card";

export default Card;
