import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[7px] border border-transparent bg-clip-padding font-sans text-sm font-medium whitespace-nowrap transition-all duration-150 outline-none select-none focus-visible:border-[rgba(79,255,176,0.4)] focus-visible:ring-3 focus-visible:ring-[rgba(79,255,176,0.06)] active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-[#ef4444] aria-invalid:ring-3 aria-invalid:ring-[rgba(239,68,68,0.18)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[#4fffb0] text-[#0a0b0e] hover:bg-[#3de89f]",
        outline:
          "border-[#2a2d35] bg-transparent text-[#e8eaf0] hover:border-[#4fffb0] hover:bg-[rgba(79,255,176,0.06)] hover:text-[#4fffb0] aria-expanded:border-[#4fffb0] aria-expanded:bg-[rgba(79,255,176,0.08)]",
        secondary:
          "bg-[#111215] text-[#e8eaf0] hover:bg-[#1c1e24] aria-expanded:bg-[#1c1e24]",
        ghost:
          "text-[#6b7280] hover:bg-[#111215] hover:text-[#e8eaf0] aria-expanded:bg-[#111215] aria-expanded:text-[#e8eaf0]",
        destructive:
          "bg-[rgba(239,68,68,0.1)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.18)] focus-visible:border-[rgba(239,68,68,0.4)] focus-visible:ring-[rgba(239,68,68,0.16)]",
        link: "text-[#4fffb0] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[6px] px-2 font-mono text-[10px] in-data-[slot=button-group]:rounded-[6px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[6px] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-[6px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 rounded-[10px] px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[6px] in-data-[slot=button-group]:rounded-[6px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[6px] in-data-[slot=button-group]:rounded-[6px]",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
