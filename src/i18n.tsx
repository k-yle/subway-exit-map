import { type IntlShape, createIntl, createIntlCache } from '@formatjs/intl';
import { translations } from './translations/index';
import type { MultiLingualNames } from './types.def';

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

export const t = (
  id: string,
  values?: Record<string, React.ReactNode | I18nComp>,
) => intl.formatMessage({ id }, values as never);

export const i18nReady = (async () => {
  const { default: messages } = await translations[locale]();

  intl = createIntl({ locale, messages }, cache);

  document.title = t('head.title') as string;
})();

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

export type I18nComp = (str: string) => React.ReactNode;
export const bold: I18nComp = (str) => <b key={0}>{str}</b>;

export const getName = (names: MultiLingualNames): string | undefined => {
  for (const lang of navigator.languages) {
    const value = names[lang] || names[lang.split('-')[0]];
    if (value) return value;
  }

  // if there's no match, use the generic `name` tag
  if (names['']) return names[''];

  // still no match, so default to english
  if (names.en) return names.en;

  // still no match, so return any language
  return Object.values(names)[0];
};
