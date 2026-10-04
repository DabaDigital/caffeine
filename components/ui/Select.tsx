"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown, Search, X, type LucideIcon } from "lucide-react";
import s from "./picker.module.css";

export type SelectOption = {
  value: string;
  label: string;
  /** A second line such as a price or hint. Searchable too. */
  description?: string;
  /** Shorter text for the closed trigger, e.g. "MA +212". */
  short?: string;
  icon?: LucideIcon;
  disabled?: boolean;
};

type PickerProps = {
  options: SelectOption[];
  /** Hidden inputs carry the value(s) when the select sits in a form. */
  name?: string;
  /** Trigger id, so a `<label htmlFor>` can point at it. */
  id?: string;
  /** Id of the visible label. Without one, pass `label` instead. */
  labelledBy?: string;
  label?: string;
  placeholder?: string;
  /** Adds a filter box, useful for long lists. */
  searchable?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
};

/** A styled single-choice dropdown (a button that opens a listbox). */
export function Select({
  value,
  defaultValue = "",
  onChange,
  ...props
}: PickerProps & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = value ?? uncontrolled;
  // "" is a real choice when an option has it (e.g. "All categories");
  // otherwise it means nothing is chosen yet and the placeholder shows.
  const chosen = props.options.some((option) => option.value === current);
  return (
    <Picker
      {...props}
      multiple={false}
      selected={chosen ? [current] : []}
      onPick={(next) => {
        if (value === undefined) setUncontrolled(next);
        onChange?.(next);
      }}
    />
  );
}

/** The same dropdown for picking several options; picks show as chips. */
export function MultiSelect({
  values,
  defaultValues = [],
  onChange,
  ...props
}: PickerProps & {
  values?: string[];
  defaultValues?: string[];
  onChange?: (values: string[]) => void;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValues);
  const current = values ?? uncontrolled;
  return (
    <Picker
      {...props}
      multiple
      selected={current}
      onPick={(value) => {
        const next = current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value];
        if (values === undefined) setUncontrolled(next);
        onChange?.(next);
      }}
    />
  );
}

function Picker({
  options,
  name,
  id,
  labelledBy,
  label,
  placeholder = "Choose…",
  searchable = false,
  invalid,
  disabled,
  describedBy,
  selected,
  multiple,
  onPick,
}: PickerProps & {
  selected: string[];
  multiple: boolean;
  onPick: (value: string) => void;
}) {
  const uid = useId();
  const triggerId = id ?? `${uid}trigger`;
  const listId = `${uid}list`;
  const ownLabelId = `${uid}label`;
  const labelId = labelledBy ?? ownLabelId;
  const optionId = (value: string) =>
    `${uid}option${options.findIndex((option) => option.value === value)}`;

  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const optionElements = useRef(new Map<string, HTMLLIElement>());
  const typed = useRef({ text: "", at: 0 });
  const [open, setOpen] = useState(false);
  const [upward, setUpward] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return options;
    return options.filter((option) =>
      `${option.label} ${option.description ?? ""}`
        .toLocaleLowerCase()
        .includes(needle),
    );
  }, [options, query]);
  const choices = visible.filter((option) => !option.disabled);
  const chosen = options.filter((option) => selected.includes(option.value));
  const SelectedIcon = !multiple ? chosen[0]?.icon : undefined;

  function show() {
    if (disabled) return;
    const box = trigger.current?.getBoundingClientRect();
    if (box) {
      const below = window.innerHeight - box.bottom;
      setUpward(below < 320 && box.top > below);
    }
    setQuery("");
    setActive(
      options.find(
        (option) => selected.includes(option.value) && !option.disabled,
      )?.value ??
        options.find((option) => !option.disabled)?.value ??
        null,
    );
    setOpen(true);
  }
  function hide() {
    setOpen(false);
    setQuery("");
    trigger.current?.focus();
  }
  function pick(value: string) {
    onPick(value);
    if (!multiple) hide();
  }

  useEffect(() => {
    if (open) (search.current ?? list.current)?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    if (open && active)
      optionElements.current.get(active)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function onKeyDown(event: KeyboardEvent) {
    const index = choices.findIndex((option) => option.value === active);
    const move = (option: SelectOption | undefined) => {
      if (option) setActive(option.value);
    };
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        return move(
          choices[index < 0 ? 0 : Math.min(index + 1, choices.length - 1)],
        );
      case "ArrowUp":
        event.preventDefault();
        return move(choices[Math.max(index - 1, 0)]);
      case "PageDown":
        event.preventDefault();
        return move(choices[Math.min(index + 8, choices.length - 1)]);
      case "PageUp":
        event.preventDefault();
        return move(choices[Math.max(index - 8, 0)]);
      case "Enter":
        event.preventDefault();
        if (index >= 0) pick(choices[index].value);
        return;
      case "Escape":
        // Keep a surrounding <dialog> open.
        event.preventDefault();
        event.stopPropagation();
        return hide();
    }
    // In the search box, Home/End/Space edit the text instead.
    if (searchable) return;
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      return move(
        event.key === "Home" ? choices[0] : choices[choices.length - 1],
      );
    }
    if (event.key === " ") {
      event.preventDefault();
      if (index >= 0) pick(choices[index].value);
      return;
    }
    if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      // Type-ahead: jump to the first option starting with what was typed.
      const now = Date.now();
      const text =
        (now - typed.current.at < 600 ? typed.current.text : "") +
        event.key.toLocaleLowerCase();
      typed.current = { text, at: now };
      move(
        choices.find((option) =>
          option.label.toLocaleLowerCase().startsWith(text),
        ),
      );
    }
  }

  return (
    <div
      ref={root}
      className={s.root}
      onBlur={(event) => {
        // Close when focus leaves the whole control (Tab away, click outside).
        if (
          open &&
          !root.current?.contains(event.relatedTarget as Node | null)
        ) {
          setOpen(false);
          setQuery("");
        }
      }}
    >
      {label && !labelledBy && (
        <span id={ownLabelId} className="sr-only">
          {label}
        </span>
      )}
      <button
        ref={trigger}
        id={triggerId}
        type="button"
        className={s.trigger}
        // A select-only combobox: the label names it, its text is the value.
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? hide() : show())}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            show();
          }
        }}
      >
        <span className={s.value}>
          {SelectedIcon && <SelectedIcon size={17} aria-hidden="true" />}
          {chosen.length === 0 ? (
            <span className={s.placeholder}>{placeholder}</span>
          ) : multiple ? (
            <span>{chosen.length} selected</span>
          ) : (
            <span>{chosen[0].short ?? chosen[0].label}</span>
          )}
        </span>
        <ChevronDown size={17} className={s.chevron} aria-hidden="true" />
      </button>

      {open && (
        <div
          className={`${s.popover} ${upward ? s.popoverUp : ""}`}
          // Clicking blank space inside keeps focus within the control.
          tabIndex={-1}
        >
          {searchable && (
            <label className={s.search}>
              <Search size={16} aria-hidden="true" />
              <input
                ref={search}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={active ? optionId(active) : undefined}
                aria-label="Search options"
                placeholder="Search…"
                value={query}
                onChange={(event) => {
                  const next = event.target.value;
                  setQuery(next);
                  const needle = next.trim().toLocaleLowerCase();
                  setActive(
                    options.find(
                      (option) =>
                        !option.disabled &&
                        `${option.label} ${option.description ?? ""}`
                          .toLocaleLowerCase()
                          .includes(needle),
                    )?.value ?? null,
                  );
                }}
                onKeyDown={onKeyDown}
              />
            </label>
          )}
          <ul
            ref={list}
            id={listId}
            role="listbox"
            tabIndex={searchable ? undefined : -1}
            aria-labelledby={labelId}
            aria-multiselectable={multiple || undefined}
            aria-activedescendant={
              !searchable && active ? optionId(active) : undefined
            }
            className={s.list}
            onKeyDown={searchable ? undefined : onKeyDown}
          >
            {visible.map((option) => {
              const isSelected = selected.includes(option.value);
              const Icon = option.icon;
              return (
                <li
                  key={option.value}
                  ref={(element) => {
                    if (element)
                      optionElements.current.set(option.value, element);
                    else optionElements.current.delete(option.value);
                  }}
                  id={optionId(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  className={`${s.option} ${option.value === active ? s.optionActive : ""}`}
                  // Keep focus in the search box while clicking.
                  onMouseDown={(event) => event.preventDefault()}
                  onPointerMove={() => {
                    if (!option.disabled && option.value !== active)
                      setActive(option.value);
                  }}
                  onClick={() => {
                    if (!option.disabled) pick(option.value);
                  }}
                >
                  {multiple && (
                    <span className={s.box} aria-hidden="true">
                      {isSelected && <Check size={13} strokeWidth={3} />}
                    </span>
                  )}
                  {Icon && <Icon size={17} aria-hidden="true" />}
                  <span className={s.optionText}>
                    <span>{option.label}</span>
                    {option.description && <small>{option.description}</small>}
                  </span>
                  {!multiple && isSelected && (
                    <Check size={16} className={s.check} aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ul>
          {visible.length === 0 && (
            <p className={s.empty}>Nothing matches “{query.trim()}”.</p>
          )}
        </div>
      )}

      {multiple && chosen.length > 0 && (
        <ul className={s.chips}>
          {chosen.map((option) => (
            <li key={option.value} className={s.chip}>
              {option.label}
              <button
                type="button"
                aria-label={`Remove ${option.label}`}
                onClick={() => onPick(option.value)}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {name &&
        (multiple ? (
          selected.map((value) => (
            <input key={value} type="hidden" name={name} value={value} />
          ))
        ) : (
          <input type="hidden" name={name} value={selected[0] ?? ""} />
        ))}
    </div>
  );
}
