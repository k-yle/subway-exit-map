import { Fragment, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, List, Typography } from '@arco-design/web-react';
import type { ItemId } from 'wikibase-sdk';
import { DataContext } from '../context/data';
import { RouteShield } from '../components/RouteShield';
import { getName, t } from '../i18n';
import { TrainsetInfo } from './TrainsetInfo';

export const RoutesByShield: React.FC = () => {
  const data = useContext(DataContext);
  const qId = useParams<{ qId: ItemId }>().qId!;
  const shieldKey = useParams().shieldKey!;

  const network = data.networks.find((n) => n.qId === qId);
  const route = data.routes[qId]?.[shieldKey];

  if (!network || !route) return null;

  const wikipedia = getName(route.wikidata?.wikipedia || {});

  return (
    <div className="main">
      <Link to={`/routes/${qId}`}>{t('generic.back')}</Link>

      <Typography.Title heading={3} className="verticalCentre">
        <Avatar size={32}>
          <img alt={getName(network.name)} src={network.logoUrl} />
        </Avatar>
        <RouteShield route={route.shield} />
        {route.wikidata?.name}
      </Typography.Title>
      {route.wikidata?.trainsets && (
        <TrainsetInfo trainsets={route.wikidata.trainsets} />
      )}
      <List
        dataSource={Object.entries(route.variants)}
        render={([key, value]) => {
          return (
            <List.Item key={key}>
              <Link to={`/routes/${qId}/${shieldKey}/${key}`}>
                <Button type="text">
                  {value.tags.via
                    ? t('RoutesByShield.label.from-to-via', value.tags)
                    : t('RoutesByShield.label.from-to', value.tags)}
                </Button>
              </Link>
            </List.Item>
          );
        }}
      />
      <br />
      {route.wikidata && (
        <>
          {t('generic.view-on', {
            name: (
              <Fragment key={0}>
                <a
                  href={`https://www.wikidata.org/wiki/${route.wikidata.qId}`}
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
        </>
      )}
    </div>
  );
};
