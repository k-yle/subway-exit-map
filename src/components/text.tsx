import { t } from '../i18n';

export const copyrightFooter = t('Home.footer', {
  a: (str: string) => (
    <a
      key={0}
      href="https://osm.org/copyright"
      target="_blank"
      rel="noreferrer"
    >
      {str}
    </a>
  ),
});
