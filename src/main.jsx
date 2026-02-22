import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import './index.css';
import App2 from './App.jsx';

// Mount React app with Ant Design ConfigProvider (Vietnamese locale)
// IMPORTANT: <App> wrapper từ antd là bắt buộc để message/notification static methods hoạt động trong AntD 5.x
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider locale={viVN}>
      <App>
        <App2 />
      </App>
    </ConfigProvider>
  </StrictMode>,
);
