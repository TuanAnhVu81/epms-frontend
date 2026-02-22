import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';

const { Content } = Layout;

// AppLayout stub — will be fully implemented in Phase 2
// Currently just renders a basic content wrapper with the child route
export default function AppLayout() {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Content style={{ padding: 24 }}>
                <Outlet />
            </Content>
        </Layout>
    );
}
