import { type IntlShape, createIntl, createIntlCache } from '@formatjs/intl';
import { translations } from './translations/index';

export type SupportedLanguage = keyof typeof translations;

export function getDefaultLanguage(): SupportedLanguage {
  // if the user chose a language last time, use it
  if (localStorage.lang) return localStorage.lang;

  // otherwise, find the first supported language
  return (
    navigator.languages
      // strip out the country code to get just the language
      .map((fullLocale) => fullLocale.split('-')[0])
      // if the user has multiple system languages, find the first one we support
      .find((lang): lang is SupportedLanguage => lang in translations) || 'en'
  );
}

export const locale = getDefaultLanguage();

document.querySelector('html')!.setAttribute('lang', locale);

const cache = createIntlCache();
let intl: IntlShape;

export const i18nReady = (async () => {
  const { default: messages } = await translations[locale]();

  intl = createIntl({ locale, messages }, cache);
})();

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- literally anything is allowed
export const t = (id: string, values?: Record<string, any>) =>
  intl.formatMessage({ id }, values);

/**
 * Set to `en-US` for all English dialects because:
 * 1. We want the oxford comma, which is only available in the `US` locale.
 * 2. We want the `&` symbol rather than ` and `, but for whatever reason
 *    this is also only available in the `US` locale.
 */
const formatterLocale = locale.startsWith('en') ? 'en-US' : locale;

const andFormatter = new Intl.ListFormat([formatterLocale], {
  type: 'conjunction',
  style: 'short',
});
export const formatList = (list: string[]) => andFormatter.format(list);

export const orFormatter = new Intl.ListFormat([formatterLocale], {
  type: 'disjunction',
  style: 'short',
});

export const bold = (str: string) => <b key={0}>{str}</b>;
