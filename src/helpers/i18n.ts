/**
 * Hardcoded to `en-US` not just because this app is only
 * available in English. More importantly,
 * 1. We want the oxford comma, which is only available in the `US` locale.
 * 2. We want the `&` symbol rather than ` and `, but for whatever reason
 *    this is also only available in the `US` locale.
 */
const andFormatter = new Intl.ListFormat(['en-US'], {
  type: 'conjunction',
  style: 'short',
});
export const formatList = (list: string[]) => andFormatter.format(list);

/** see above regarding locale (although point 2 is irrelevant in this case) */
export const orFormatter = new Intl.ListFormat(['en-US'], {
  type: 'disjunction',
  style: 'short',
});
