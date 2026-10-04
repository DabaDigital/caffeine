"use client";

import { useId, useState } from "react";
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { Select, type SelectOption } from "./Select";
import s from "./picker.module.css";

let countryOptions: SelectOption[] | undefined;
/** Every country libphonenumber knows, by English name, with its dialing code. */
function countries() {
  if (countryOptions) return countryOptions;
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  countryOptions = getCountries()
    .map((code) => {
      const dial = `+${getCountryCallingCode(code)}`;
      return {
        value: code,
        label: names.of(code) ?? code,
        description: dial,
        short: `${code} ${dial}`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "en"));
  return countryOptions;
}

/**
 * Phone number with a country picker, formatted as you type. The hidden
 * input submits the international form ("+212690077741"); the server
 * validates it again with libphonenumber.
 */
export function PhoneInput({
  name,
  id,
  labelledBy,
  describedBy,
  invalid,
  defaultValue = "",
  defaultCountry = "MA",
  placeholder = "06 12 34 56 78",
}: {
  name?: string;
  id?: string;
  labelledBy?: string;
  describedBy?: string;
  invalid?: boolean;
  defaultValue?: string;
  defaultCountry?: CountryCode;
  placeholder?: string;
}) {
  const uid = useId();
  const initial = parsePhoneNumberFromString(defaultValue, defaultCountry);
  const [country, setCountry] = useState<CountryCode>(
    initial?.country ?? defaultCountry,
  );
  const [text, setText] = useState(
    initial ? initial.formatNational() : defaultValue,
  );
  const parsed = text.trim()
    ? parsePhoneNumberFromString(text, country)
    : undefined;
  const submitted = text.trim() ? (parsed?.number ?? text.trim()) : "";

  return (
    <div className={s.phone}>
      <Select
        label="Country code"
        options={countries()}
        value={country}
        onChange={(next) => setCountry(next as CountryCode)}
        searchable
      />
      <input
        id={id ?? `${uid}number`}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        className={s.input}
        value={text}
        placeholder={placeholder}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        onChange={(event) => {
          const input = event.currentTarget;
          const raw = input.value;
          // Format only while typing at the end, so editing mid-number
          // never makes the caret jump.
          const typingAtEnd =
            raw.length > text.length && input.selectionStart === raw.length;
          setText(typingAtEnd ? new AsYouType(country).input(raw) : raw);
          if (raw.startsWith("+")) {
            const detected = parsePhoneNumberFromString(raw)?.country;
            if (detected) setCountry(detected);
          }
        }}
      />
      {name && <input type="hidden" name={name} value={submitted} />}
    </div>
  );
}
