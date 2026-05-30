import * as React from "react";
import { Input } from "@/components/ui/input";
import { maskPhoneBrInput, PHONE_BR_PLACEHOLDER } from "@/lib/normalize-phone";
import { cn } from "@/lib/utils";

export type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "onChange" | "inputMode" | "autoComplete"
> & {
  value?: string;
  onValueChange?: (value: string) => void;
};

/**
 * Campo de telefone BR com máscara (DDD) 99999-9999.
 * Persistência: normalize com normalizeSupporterPhone no submit.
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = "", onValueChange, onBlur, disabled, placeholder, ...props }, ref) => {
    const display = maskPhoneBrInput(value);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const masked = maskPhoneBrInput(e.target.value);
      onValueChange?.(masked);
    }

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        disabled={disabled}
        placeholder={placeholder ?? PHONE_BR_PLACEHOLDER}
        className={cn(className)}
        value={display}
        onChange={handleChange}
        onBlur={onBlur}
        maxLength={16}
        {...props}
      />
    );
  },
);
PhoneInput.displayName = "PhoneInput";
