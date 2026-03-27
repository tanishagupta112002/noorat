"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ChangeEventHandler,
  FocusEventHandler,
  forwardRef,
  useEffect,
  useMemo,
  useState,
} from "react";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type CustomSelectProps = {
  id?: string;
  name?: string;
  label?: string;
  options: SelectOption[];
  containerClassName?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  value?: string;
  defaultValue?: string;
  onBlur?: FocusEventHandler<HTMLSelectElement>;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  onValueChange?: (value: string) => void;
};

const EMPTY_SENTINEL = "__custom_select_empty__";

function isEmptyValue(value: string | undefined) {
  return value === undefined || value === "";
};

export const CustomSelect = forwardRef<HTMLSelectElement, CustomSelectProps>(
  (
    {
      label,
      options,
      disabled = false,
      className = "",
      containerClassName = "",
      onChange,
      onValueChange,
      onBlur,
      id,
      name,
      required,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue ?? "");

    const selectedValue = value ?? internalValue;
    const selectValue = isEmptyValue(selectedValue) ? EMPTY_SENTINEL : selectedValue;

    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    const placeholder = useMemo(
      () => options.find((option) => isEmptyValue(option.value))?.label ?? "Select an option",
      [options]
    );

    const selectableOptions = useMemo(
      () => options.filter((option) => !isEmptyValue(option.value)),
      [options]
    );

    function handleValueChange(nextValue: string) {
      if (nextValue === EMPTY_SENTINEL) {
        return;
      }

      if (value === undefined) {
        setInternalValue(nextValue);
      }

      onValueChange?.(nextValue);

      if (name) {
        onChange?.({
          target: { name, value: nextValue },
          currentTarget: { name, value: nextValue },
          type: "change",
        } as unknown as Parameters<NonNullable<typeof onChange>>[0]);
      }
    }

    return (
      <div className={`space-y-2 ${containerClassName}`}>
        {label && <Label>{label}</Label>}
        <Select
          value={selectValue}
          onValueChange={handleValueChange}
          disabled={disabled}
          {...props}
        >
          <SelectTrigger
            id={id}
            className={cn(
              "h-10 rounded-md border border-input bg-white px-3 py-2 text-sm shadow-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              className
            )}
            onBlur={onBlur as unknown as FocusEventHandler<HTMLButtonElement>}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent side="bottom" position="popper" avoidCollisions={false} className="max-h-52 overflow-y-auto">
            <SelectItem value={EMPTY_SENTINEL} disabled className="hidden">
              {placeholder}
            </SelectItem>
            {selectableOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <select
          ref={ref}
          name={name}
          value={selectedValue}
          onChange={() => undefined}
          required={required}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

CustomSelect.displayName = "CustomSelect";
