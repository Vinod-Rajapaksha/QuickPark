import React, { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      leftIcon,
      rightIcon,
      type = "text",
      className = "",
      required,
      ...props
    },
    ref,
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword
      ? isPasswordVisible
        ? "text"
        : "password"
      : type;

    return (
      <div className={`flex flex-col gap-1.5 w-full ${className}`}>
        {label && (
          <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-slate-900 
              transition-all duration-200 placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
              disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
              ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 hover:border-slate-300"}
              ${leftIcon ? "pl-10" : ""}
              ${rightIcon || isPassword || error ? "pr-10" : ""}
            `}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          <div className="absolute right-3 flex items-center gap-2">
            {error && !isFocused && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            {isPassword && (
              <button
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
                tabIndex={-1}
              >
                {isPasswordVisible ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}
            {!isPassword && rightIcon && (
              <div className="text-slate-400">{rightIcon}</div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-red-500"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
