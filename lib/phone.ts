import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import type { ContactType } from "@/lib/site";

// Phone numbers are stored in international E.164 form ("+212690077741");
// numbers typed without a country code are read as Moroccan.
export const defaultCountry: CountryCode = "MA";

export function parsePhone(
  value: string,
  country: CountryCode = defaultCountry,
) {
  return parsePhoneNumberFromString(value, country);
}

/** E.164 form of a valid number, or null. */
export function toE164(value: string, country: CountryCode = defaultCountry) {
  const phone = parsePhone(value, country);
  return phone?.isValid() ? phone.number : null;
}

/** "+212 6 90 07 77 41"; values that don't parse are shown as entered. */
export function formatPhone(value: string) {
  return parsePhone(value)?.formatInternational() ?? value;
}

export function contactHref(type: ContactType, value: string) {
  if (type === "email") return `mailto:${value}`;
  const number = toE164(value) ?? value.replace(/[^\d+]/g, "");
  return type === "whatsapp"
    ? `https://wa.me/${number.replace(/\D/g, "")}`
    : `tel:${number}`;
}
