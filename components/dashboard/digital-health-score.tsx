"use client"

import { cn } from "@/lib/utils"

interface DigitalHealthScoreProps {
  score: number
  size?: "sm" | "md" | "lg"
}

export function DigitalHealthScore({ score, size = "md" }: DigitalHealthScoreProps) {
  const sizeClasses = {
    sm: { container: "w-12 h-12", text: "text-xs", stroke: 3 },
    md: { container: "w-16 h-16", text: "text-sm", stroke: 4 },
    lg: { container: "w-24 h-24", text: "text-lg", stroke: 5 },
  }

  const { container, text, stroke } = sizeClasses[size]
  const radius = 50 - stroke
  const circumference = 2 * Math.PI * radius
  const progress = ((100 - score) / 100) * circumference

  const getScoreColor = (score: number) => {
    if (score <= 30) return { ring: "stroke-destructive", text: "text-destructive" }
    if (score <= 60) return { ring: "stroke-warning", text: "text-warning-foreground" }
    return { ring: "stroke-success", text: "text-success" }
  }

  const colors = getScoreColor(score)

  return (
    <div className={cn("relative", container)}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          className={cn("transition-all duration-500", colors.ring)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("font-semibold", text, colors.text)}>{score}</span>
      </div>
    </div>
  )
}
