"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-bold mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full px-3 py-2 border-2 border-black rounded bg-white focus:outline-none focus:ring-2 focus:ring-honey-400 ${
            error ? "border-pop-500 focus:ring-pop-400" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="text-pop-500 text-xs mt-1 font-bold">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
