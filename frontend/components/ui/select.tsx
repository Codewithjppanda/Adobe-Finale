"use client";
import * as React from "react";

type SelectRootProps = React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string };
export function Select({ children, className = "", ...props }: SelectRootProps) {
  return (
    <div className={"relative " + className} {...props}>
      {children}
    </div>
  );
}

export function SelectTrigger({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        "h-9 px-3 inline-flex items-center justify-between rounded-md border border-input bg-background text-sm text-foreground " +
        className
      }
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="opacity-60">{placeholder ?? "Select"}</span>;
}

export function SelectContent({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={"hidden " + className} {...props}>
      {children}
    </div>
  );
}

export function SelectItem({ children, value }: { children: React.ReactNode; value: string }) {
  return (
    <div data-value={value} className="px-3 py-2 text-sm">
      {children}
    </div>
  );
}


