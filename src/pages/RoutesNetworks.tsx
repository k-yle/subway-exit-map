import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, List } from '@arco-design/web-react';
import { DataContext } from '../context/data';
import { getName, t } from '../i18n';

export const RoutesNetworks: React.FC = () => {
  const data = useContext(DataContext);

  return (
    <div className="main">
      <Link to="/">{t('generic.back')}</Link>
      <List
        dataSource={data.networks}
        render={(network) => {
          const name = getName(network.name);
          return (
            <List.Item key={network.qId}>
              <Link to={`/routes/${network.qId}`}>
                <Button type="text">
                  <Avatar size={24}>
                    <img alt={name} src={network.logoUrl} />
                  </Avatar>
                  {name}
                </Button>
              </Link>
            </List.Item>
          );
        }}
      />
    </div>
  );
};
