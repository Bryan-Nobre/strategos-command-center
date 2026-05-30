import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  id?: string;
};

export function PhoneFormField<T extends FieldValues>({
  control,
  name,
  label = "Telefone",
  required,
  className,
  disabled,
  id,
}: Props<T>) {
  const fieldId = id ?? String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={cn("grid gap-2", className)}>
          <Label htmlFor={fieldId}>
            {label}
            {required ? " *" : null}
          </Label>
          <PhoneInput
            id={fieldId}
            disabled={disabled}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            aria-invalid={!!fieldState.error}
          />
          {fieldState.error && (
            <p className="text-xs text-destructive">{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
}
