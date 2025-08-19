import * as React from "react";

export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={"border border-border bg-card text-foreground " + className} {...props} />;
}


