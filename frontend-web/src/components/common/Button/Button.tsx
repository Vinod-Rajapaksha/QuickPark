import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "danger" | "white";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends Omit<
  HTMLMotionProps<"button">,
  "ref" | "children"
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary:
        "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-md hover:shadow-lg",
      secondary:
        "bg-primary-100 text-primary-900 hover:bg-primary-200 focus:ring-primary-500",
      outline:
        "border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 bg-transparent",
      ghost:
        "text-primary-600 hover:bg-primary-50 focus:ring-primary-500 bg-transparent",
      danger:
        "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md hover:shadow-lg",
      white:
        "bg-white text-slate-900 hover:bg-slate-100 focus:ring-white shadow-md hover:shadow-lg",
    };

    const sizes = {
      sm: "text-sm px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-6 py-3 gap-3",
      icon: "p-2",
    };

    const widthClass = fullWidth ? "w-full" : "";

    const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`;

    return (
      <motion.button
        ref={ref}
        className={combinedClasses}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!isLoading && leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </motion.button>
    );
  },
);

Button.displayName = "Button";

export default Button;
