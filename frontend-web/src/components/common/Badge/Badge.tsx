import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

export type BadgeVariant =
  "success" | "warning" | "error" | "info" | "default" | "primary";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends Omit<
  HTMLMotionProps<"span">,
  "ref" | "children"
> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      variant = "default",
      size = "sm",
      dot = false,
      className = "",
      ...props
    },
    ref,
  ) => {
    const baseStyles = "inline-flex items-center font-medium rounded-full";

    const variants = {
      success: "bg-emerald-100 text-emerald-800",
      warning: "bg-amber-100 text-amber-800",
      error: "bg-red-100 text-red-800",
      info: "bg-blue-100 text-blue-800",
      primary: "bg-primary-100 text-primary-800",
      default: "bg-slate-100 text-slate-800",
    };

    const dotColors = {
      success: "bg-emerald-500",
      warning: "bg-amber-500",
      error: "bg-red-500",
      info: "bg-blue-500",
      primary: "bg-primary-500",
      default: "bg-slate-500",
    };

    const sizes = {
      sm: "text-xs px-2.5 py-0.5 gap-1.5",
      md: "text-sm px-3 py-1 gap-2",
    };

    const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <motion.span
        ref={ref}
        className={combinedClasses}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        {...props}
      >
        {dot && (
          <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
        )}
        {children}
      </motion.span>
    );
  },
);

Badge.displayName = "Badge";

export default Badge;
