import * as React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

interface CardProps extends React.ComponentProps<"div"> {
  href?: string;
  linkProps?: React.AnchorHTMLAttributes<HTMLAnchorElement>;
}

function Card({ className, href, linkProps, ...props }: CardProps) {
  const Comp = href ? Link : "div";
  
  return (
    <Comp
      data-slot="card"
      to={href}
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        href && "cursor-pointer no-underline text-inherit",
        className
      )}
      {...(href ? { ...linkProps, style: { color: 'inherit', textDecoration: 'none' } } : {})}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 px-6", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
