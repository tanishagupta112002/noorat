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
import { Check, ChevronDown, Search } from "lucide-react";
import {
  ChangeEventHandler,
  FocusEventHandler,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  swatchClass?: string;
  searchTerms?: string[];
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
  searchable?: boolean;
  searchPlaceholder?: string;
  showColorSwatch?: boolean;
  onBlur?: FocusEventHandler<HTMLSelectElement>;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  onValueChange?: (value: string) => void;
};

const EMPTY_SENTINEL = "__custom_select_empty__";

function isEmptyValue(value: string | undefined) {
  return value === undefined || value === "";
}

// ── Searchable Combobox (pure React, no Radix Select) ──────────────────────

type ComboboxProps = {
  id?: string;
  name?: string;
  label?: string;
  options: SelectOption[];
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  required?: boolean;
  value?: string;
  defaultValue?: string;
  placeholder: string;
  searchPlaceholder?: string;
  showColorSwatch?: boolean;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  onValueChange?: (value: string) => void;
};

function Combobox({
  id,
  name,
  label,
  options,
  className,
  containerClassName,
  disabled,
  required,
  value,
  defaultValue,
  placeholder,
  searchPlaceholder,
  showColorSwatch,
  onChange,
  onValueChange,
}: ComboboxProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const selectedValue = value ?? internalValue;
  const selectableOptions = useMemo(
    () => options.filter((o) => !isEmptyValue(o.value)),
    [options]
  );

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return selectableOptions;
    const q = searchQuery.toLowerCase();

    // 1) Prefer direct label matches for precise results (important for categories)
    const labelMatches = selectableOptions.filter((o) =>
      o.label.toLowerCase().includes(q)
    );
    if (labelMatches.length > 0) {
      return labelMatches;
    }

    // 2) Fallback to broader aliases/search terms only when label has no matches
    return selectableOptions.filter((o) =>
      (o.searchTerms ?? []).join(" ").toLowerCase().includes(q)
    );
  }, [selectableOptions, searchQuery]);

  const selectedOption = selectableOptions.find((o) => o.value === selectedValue);

  function updateDropdownPosition() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const clickedInsideTrigger = !!containerRef.current?.contains(target);
      const clickedInsideDropdown = !!dropdownRef.current?.contains(target);

      if (!clickedInsideTrigger && !clickedInsideDropdown) {
        setOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search when opening
  useEffect(() => {
    if (open) {
      updateDropdownPosition();
      const handleViewportChange = () => updateDropdownPosition();
      window.addEventListener("resize", handleViewportChange);
      window.addEventListener("scroll", handleViewportChange, true);
      setTimeout(() => searchRef.current?.focus(), 20);

      return () => {
        window.removeEventListener("resize", handleViewportChange);
        window.removeEventListener("scroll", handleViewportChange, true);
      };
    }
  }, [open]);

  function handleSelect(option: SelectOption) {
    if (option.disabled) return;
    const next = option.value;
    if (value === undefined) setInternalValue(next);
    setOpen(false);
    setSearchQuery("");
    onValueChange?.(next);
    if (name) {
      onChange?.({
        target: { name, value: next },
        currentTarget: { name, value: next },
        type: "change",
      } as unknown as Parameters<NonNullable<typeof onChange>>[0]);
    }
  }

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div ref={containerRef} className="relative">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !selectedOption && "text-muted-foreground",
            className
          )}
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            {showColorSwatch && selectedOption?.swatchClass ? (
              <span className={cn("h-4 w-4 shrink-0 rounded-full", selectedOption.swatchClass)} />
            ) : null}
            <span className="truncate">{selectedOption?.label ?? placeholder}</span>
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          createPortal(
            <div
              ref={dropdownRef}
              style={dropdownStyle}
              className="overflow-hidden rounded-md border border-border bg-white shadow-2xl"
            >
              {/* Search bar */}
              <div className="border-b border-border p-2">
                <div className="flex items-center gap-2 rounded border border-input bg-white px-2 py-1.5">
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder ?? "Search..."}
                    className="w-full border-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Options list */}
              <div className="max-h-40 overflow-y-auto py-1">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={option.disabled}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        option.value === selectedValue && "bg-accent/50 font-medium"
                      )}
                    >
                      {showColorSwatch && option.swatchClass ? (
                        <span className={cn("h-4 w-4 shrink-0 rounded-full", option.swatchClass)} />
                      ) : null}
                      <span className="flex-1 text-left">{option.label}</span>
                      {option.value === selectedValue && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No {label?.toLowerCase() ?? "options"} found for &ldquo;{searchQuery}&rdquo;
                  </p>
                )}
              </div>
            </div>,
            document.body
          )
        )}
      </div>

      {/* Hidden native select for form submission */}
      <select
        name={name}
        value={selectedValue}
        onChange={() => undefined}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      >
        <option value="" />
        {selectableOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Main CustomSelect ───────────────────────────────────────────────────────

export const CustomSelect = forwardRef<HTMLSelectElement, CustomSelectProps>(
  (
    {
      label,
      options,
      disabled = false,
      className = "",
      containerClassName = "",
      searchable = false,
      searchPlaceholder,
      showColorSwatch = false,
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
      if (nextValue === EMPTY_SENTINEL) return;
      if (value === undefined) setInternalValue(nextValue);
      onValueChange?.(nextValue);
      if (name) {
        onChange?.({
          target: { name, value: nextValue },
          currentTarget: { name, value: nextValue },
          type: "change",
        } as unknown as Parameters<NonNullable<typeof onChange>>[0]);
      }
    }

    // Use custom Combobox for searchable variant
    if (searchable) {
      return (
        <Combobox
          id={id}
          name={name}
          label={label}
          options={options}
          className={className}
          containerClassName={containerClassName}
          disabled={disabled}
          required={required}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          searchPlaceholder={searchPlaceholder}
          showColorSwatch={showColorSwatch}
          onChange={onChange}
          onValueChange={onValueChange}
        />
      );
    }

    // Non-searchable: use Radix Select as before
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
          <SelectContent
            side="bottom"
            position="popper"
            avoidCollisions={false}
            className="z-50 max-h-52 overflow-y-auto border-border bg-white shadow-2xl"
          >
            <SelectItem value={EMPTY_SENTINEL} disabled className="text-muted-foreground">
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