'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value?: number
  onChange?: (value: number) => void
  onValueChange?: (value: number) => void
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, onValueChange, onClick, onWheel, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      const numValue = value.includes('.') ? parseFloat(value) || 0 : parseInt(value) || 0
      onChange?.(numValue)
      onValueChange?.(numValue)
    }

    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      // Clear the input on single click
      const target = e.currentTarget
      target.select()
      onClick?.(e)
    }

    const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
      // Prevent scroll wheel from changing the value
      e.currentTarget.blur()
      onWheel?.(e)
    }

    return (
      <input
        type="number"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        value={value}
        onChange={handleChange}
        onClick={handleClick}
        onWheel={handleWheel}
        ref={ref}
        {...props}
      />
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }