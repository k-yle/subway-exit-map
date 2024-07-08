import { useContext, useState } from 'react';
import { Button, Modal, Switch, Typography } from '@arco-design/web-react';
import { IconCheck } from '@arco-design/web-react/icon';
import { SettingsContext } from '../context/settings';

export const Settings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, setSettings } = useContext(SettingsContext);

  return (
    <>
      <Button
        type="text"
        onClick={() => setIsOpen(true)}
        style={{ padding: 0 }}
      >
        Settings
      </Button>
      <Modal
        title="Settings"
        visible={isOpen}
        onOk={() => setIsOpen(false)}
        onCancel={() => setIsOpen(false)}
        autoFocus={false}
        focusLock
        hideCancel
        okText="Close"
      >
        <Typography.Title heading={6} style={{ margin: '8px 0' }}>
          Stations
        </Typography.Title>
        <Switch
          checkedIcon={<IconCheck />}
          checked={settings.showPassThroughRoutes ?? false}
          onChange={(newValue) =>
            setSettings((c) => ({ ...c, showPassThroughRoutes: newValue }))
          }
        />{' '}
        Show routes that never stop at each platform
        <Typography.Title heading={6} style={{ margin: '8px 0' }}>
          Routes
        </Typography.Title>
        <Switch
          checkedIcon={<IconCheck />}
          checked={settings.showConnectingRoutes ?? false}
          onChange={(newValue) =>
            setSettings((c) => ({ ...c, showConnectingRoutes: newValue }))
          }
        />{' '}
        Show connecting routes
      </Modal>
    </>
  );
};
