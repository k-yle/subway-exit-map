/**
 * there is an extensive comment in the other file called i18n.ts,
 * see that file for important info about why the locale is hardcoded.
 */

const andFormatter = new Intl.ListFormat(['en-US'], {
  type: 'conjunction',
  style: 'short',
});
export const formatList = (list: string[]) => andFormatter.format(list);
