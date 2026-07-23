"use client"

import * as React from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns"

import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
  initialMonth?: Date
}

function Calendar({
  selected,
  onSelect,
  className,
  initialMonth = new Date(),
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(initialMonth)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="inline-flex items-center justify-center rounded-md p-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            type="button"
            onClick={goToToday}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Today
          </button>
        </div>
        <button
          type="button"
          onClick={goToNextMonth}
          className="inline-flex items-center justify-center rounded-md p-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mt-1">
        {days.map((day) => {
          const isSelected = selected ? isSameDay(day, selected) : false
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isTodayDate = isToday(day)

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect?.(day)}
              className={cn(
                "inline-flex items-center justify-center rounded-md p-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                !isCurrentMonth && "text-muted-foreground opacity-50",
                isTodayDate && "bg-accent text-accent-foreground",
                isSelected &&
                  "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
