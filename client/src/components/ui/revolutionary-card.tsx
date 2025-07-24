import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface RevolutionaryCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function RevolutionaryCard({ 
  children, 
  className = "", 
  hover = true 
}: RevolutionaryCardProps) {
  return (
    <div 
      className={cn(
        "revolutionary-card",
        hover && "hover:scale-105 hover:shadow-xl",
        "transition-all duration-300 ease-in-out",
        className
      )}
    >
      {children}
    </div>
  );
}
