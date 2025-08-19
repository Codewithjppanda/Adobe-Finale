import * as React from "react";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={
        "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-0 focus:border-ring/60 " +
        className
      }
      {...props}
    />
  )
);
Input.displayName = "Input";


