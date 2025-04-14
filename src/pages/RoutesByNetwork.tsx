import { Fragment, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, List, Typography } from '@arco-design/web-react';
import type { ItemId } from 'wikibase-sdk';
import { DataContext } from '../context/data';
import { RouteShield } from '../components/RouteShield';
import { getName, t } from '../i18n';

export const RoutesByNetwork: React.FC = () => {
  const data = useContext(DataContext);
  const qId = useParams<{ qId: ItemId }>().qId!;

  const network = data.networks.find((n) => n.qId === qId);
  const routes = data.routes[qId];

  if (!network || !routes) return null;

  const wikipedia = getName(network.wikipedia);

  return (
    <div className="main">
      <Link to="/routes">{t('generic.back')}</Link>
      <Typography.Title heading={3} className="verticalCentre">
        <Avatar size={32}>
          <img alt={getName(network.name)} src={network.logoUrl} />
        </Avatar>
        {getName(network.name)}
      </Typography.Title>
      <List
        dataSource={Object.entries(routes).sort(([, a], [, b]) =>
          (a.shield.ref || '').localeCompare(b.shield.ref || ''),
        )}
        render={([key, value]) => {
          const desinations = [
            ...new Set(
              Object.values(value.variants).flatMap((x) => [
                x.tags.from,
                x.tags.to,
              ]),
            ),
          ]
            .filter((x): x is string => !!x)
            .sort((a, b) => a.localeCompare(b));

          return (
            <List.Item key={key}>
              <Link to={`/routes/${qId}/${key}`}>
                <Button type="text">
                  <RouteShield route={value.shield} />{' '}
                  <div>
                    {value.wikidata?.name ||
                      desinations.flatMap((x) => [x, <br key={x} />])}
                  </div>
                </Button>
              </Link>
            </List.Item>
          );
        }}
      />
      <br />
      {t('generic.view-on', {
        name: (
          <Fragment key={0}>
            <a
              href={`https://www.wikidata.org/wiki/${network.qId}`}
              target="_blank"
              rel="noreferrer"
            >
              Wikidata
            </a>
            {wikipedia && (
              <>
                {' | '}
                <a
                  href={`https://en.wikipedia.org/wiki/${wikipedia}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Wikipedia
                </a>
              </>
            )}
          </Fragment>
        ),
      })}
    </div>
  );
};
