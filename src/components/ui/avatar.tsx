"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface AvatarContextValue {
  imageLoadingStatus: "idle" | "loading" | "loaded" | "error"
  setImageLoadingStatus: (status: "idle" | "loading" | "loaded" | "error") => void
}

const AvatarContext = React.createContext<AvatarContextValue>({
  imageLoadingStatus: "idle",
  setImageLoadingStatus: () => {},
})

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, ...props }, ref) => {
    const [imageLoadingStatus, setImageLoadingStatus] =
      React.useState<"idle" | "loading" | "loaded" | "error">("idle")

    return (
      <AvatarContext.Provider
        value={{ imageLoadingStatus, setImageLoadingStatus }}
      >
        <div
          ref={ref}
          className={cn(
            "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
            className
          )}
          {...props}
        />
      </AvatarContext.Provider>
    )
  }
)
Avatar.displayName = "Avatar"

interface AvatarImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string
  alt?: string
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, src, alt, onLoad, onError, ...props }, ref) => {
    const { setImageLoadingStatus } = React.useContext(AvatarContext)

    React.useEffect(() => {
      if (!src) {
        setImageLoadingStatus("error")
        return
      }

      setImageLoadingStatus("loading")

      const img = new Image()
      img.src = src
      img.onload = () => {
        setImageLoadingStatus("loaded")
      }
      img.onerror = () => {
        setImageLoadingStatus("error")
      }
    }, [src, setImageLoadingStatus])

    if (!src) return null

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cn("aspect-square h-full w-full", className)}
        onLoad={(e) => {
          setImageLoadingStatus("loaded")
          onLoad?.(e)
        }}
        onError={(e) => {
          setImageLoadingStatus("error")
          onError?.(e)
        }}
        {...props}
      />
    )
  }
)
AvatarImage.displayName = "AvatarImage"

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  delayMs?: number
}

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, delayMs, ...props }, ref) => {
    const { imageLoadingStatus } = React.useContext(AvatarContext)
    const [canRender, setCanRender] = React.useState(
      delayMs === undefined
    )

    React.useEffect(() => {
      if (delayMs !== undefined) {
        const timer = setTimeout(() => setCanRender(true), delayMs)
        return () => clearTimeout(timer)
      }
    }, [delayMs])

    if (imageLoadingStatus === "loaded" || !canRender) return null

    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full bg-muted",
          className
        )}
        {...props}
      />
    )
  }
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
