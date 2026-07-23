"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal"
  scrollbarWidth?: number
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = "vertical", scrollbarWidth = 6, ...props }, ref) => {
    const contentRef = React.useRef<HTMLDivElement>(null)
    const [showScrollbar, setShowScrollbar] = React.useState(false)
    const [scrollPosition, setScrollPosition] = React.useState(0)
    const [scrollableRatio, setScrollableRatio] = React.useState(1)

    React.useEffect(() => {
      const content = contentRef.current
      if (!content) return

      const handleScroll = () => {
        if (orientation === "vertical") {
          const { scrollTop, scrollHeight, clientHeight } = content
          const maxScroll = scrollHeight - clientHeight
          setScrollPosition(maxScroll > 0 ? scrollTop / maxScroll : 0)
          setScrollableRatio(clientHeight / scrollHeight)
        } else {
          const { scrollLeft, scrollWidth, clientWidth } = content
          const maxScroll = scrollWidth - clientWidth
          setScrollPosition(maxScroll > 0 ? scrollLeft / maxScroll : 0)
          setScrollableRatio(clientWidth / scrollWidth)
        }
      }

      const handleMouseEnter = () => setShowScrollbar(true)
      const handleMouseLeave = () => setShowScrollbar(false)

      content.addEventListener("scroll", handleScroll)
      content.addEventListener("mouseenter", handleMouseEnter)
      content.addEventListener("mouseleave", handleMouseLeave)

      return () => {
        content.removeEventListener("scroll", handleScroll)
        content.removeEventListener("mouseenter", handleMouseEnter)
        content.removeEventListener("mouseleave", handleMouseLeave)
      }
    }, [orientation])

    const isVertical = orientation === "vertical"

    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        <div
          ref={contentRef}
          className="h-full w-full overflow-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style>{`
            [data-scroll-area]::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div data-scroll-area>{children}</div>
        </div>

        <div
          className={cn(
            "absolute transition-opacity duration-200",
            isVertical
              ? `right-0 top-0 h-full w-[${scrollbarWidth}px]`
              : `bottom-0 left-0 h-[${scrollbarWidth}px] w-full`,
            showScrollbar ? "opacity-100" : "opacity-0"
          )}
        >
          <div
            className={cn(
              "absolute rounded-full bg-border/50 transition-all duration-100",
              isVertical ? "right-0.5" : "bottom-0.5"
            )}
            style={
              isVertical
                ? {
                    width: `${scrollbarWidth - 2}px`,
                    height: `${Math.max(scrollableRatio * 100, 20)}%`,
                    top: `${scrollPosition * (100 - scrollableRatio * 100)}%`,
                  }
                : {
                    height: `${scrollbarWidth - 2}px`,
                    width: `${Math.max(scrollableRatio * 100, 20)}%`,
                    left: `${scrollPosition * (100 - scrollableRatio * 100)}%`,
                  }
            }
          />
        </div>
      </div>
    )
  }
)
ScrollArea.displayName = "ScrollArea"

interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal"
}

const ScrollBar = React.forwardRef<HTMLDivElement, ScrollBarProps>(
  ({ className, orientation = "vertical", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent p-[1px]",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent p-[1px]",
        className
      )}
      {...props}
    />
  )
)
ScrollBar.displayName = "ScrollBar"

export { ScrollArea, ScrollBar }
