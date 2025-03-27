import * as React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

type BaseCardProps = {
  className?: string;
  children?: React.ReactNode;
}

type DivCardProps = BaseCardProps & Omit<React.HTMLAttributes<HTMLDivElement>, keyof BaseCardProps>
type LinkCardProps = BaseCardProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseCardProps> & {
  href: string;
}

type CardProps = DivCardProps | LinkCardProps

function Card(props: CardProps) {
  if ('href' in props) {
    const { href, className, ...rest } = props
    return (
      <Link
        data-slot="card"
        to={href}
        className={cn(
          "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 dark:border-gray-700 py-6 shadow-sm",
          "cursor-pointer no-underline text-inherit",
          className
        )}
        style={{ color: 'inherit', textDecoration: 'none' }}
        {...rest}
      />
    )
  }

  const { className, ...rest } = props
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 dark:border-gray-700 py-6 shadow-sm",
        className
      )}
      {...rest}
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
