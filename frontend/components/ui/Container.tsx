import { cn } from "@/src/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Container({ children, className, size = "lg" }: ContainerProps) {
  const sizes = {
    sm: "max-w-3xl",
    md: "max-w-5xl", 
    lg: "max-w-7xl",
    xl: "max-w-8xl"
  };

  return (
    <div className={cn(sizes[size], "mx-auto px-6", className)}>
      {children}
    </div>
  );
}
