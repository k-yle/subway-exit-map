import { useContext, useState } from 'react';
import { Button, Modal, Switch, Typography } from '@arco-design/web-react';
import { IconCheck } from '@arco-design/web-react/icon';
import { SettingsContext } from '../context/settings';
import { t } from '../i18n';

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
        {t('Settings.settings')}
      </Button>
      <Modal
        title={t('Settings.settings')}
        visible={isOpen}
        onOk={() => setIsOpen(false)}
        onCancel={() => setIsOpen(false)}
        focusLock
        hideCancel
        okText={t('generic.close')}
      >
        <Typography.Title heading={6} style={{ margin: '8px 0' }}>
          {t('generic.stations')}
        </Typography.Title>
        <Switch
          checkedIcon={<IconCheck />}
          checked={settings.showPassThroughRoutes ?? false}
          onChange={(newValue) =>
            setSettings((c) => ({ ...c, showPassThroughRoutes: newValue }))
          }
        />{' '}
        {t('Settings.showPassThroughRoutes')}
        <Typography.Title heading={6} style={{ margin: '8px 0' }}>
          {t('generic.routes')}
        </Typography.Title>
        <Switch
          checkedIcon={<IconCheck />}
          checked={settings.showConnectingRoutes ?? false}
          onChange={(newValue) =>
            setSettings((c) => ({ ...c, showConnectingRoutes: newValue }))
          }
        />{' '}
        {t('Settings.showConnectingRoutes')}
      </Modal>
    </>
  );
};
