import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Layout, Menu } from 'antd/lib';
import PropTypes from 'prop-types';
import Login from '../Login';
import Footer from './Footer';
import { CustomLayout, Logo } from './styles';

const LogoSvg = dynamic(() => import('common-util/SVGs/logo'));

const { Header, Content } = Layout;

const NavigationBar = ({ children }) => {
  const router = useRouter();
  const { pathname } = router;
  const [selectedMenu, setSelectedMenu] = useState([]);

  // to set default menu on first render
  useEffect(() => {
    if (pathname) {
      const name = pathname.split('/')[1];
      setSelectedMenu(name || 'veolas');
    }
  }, [pathname]);

  const handleMenuItemClick = ({ key }) => {
    router.push(`/${key}`);
    setSelectedMenu(key);
  };

  return (
    <CustomLayout pathname={router.pathname}>
      <Header>
        <div className="column-1">
          <Logo data-testid="tokenomics-logo">
            <LogoSvg />
            <span>Tokenomics</span>
          </Logo>
        </div>

        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[selectedMenu]}
          onClick={handleMenuItemClick}
          items={[
            {
              key: 'donate',
              label: 'Donate',
            },
            {
              key: 'dev-incentives',
              label: 'Dev Incentives',
            },
            {
              key: 'bonding-products',
              label: 'Bonding Products',
            },
            {
              key: 'my-bonds',
              label: 'My Bonds',
            },
          ]}
        />
        <Login />
      </Header>

      <Content className="site-layout">
        <div className="site-layout-background">{children}</div>
      </Content>

      <Footer />
    </CustomLayout>
  );
};

NavigationBar.propTypes = {
  children: PropTypes.element,
};

NavigationBar.defaultProps = {
  children: null,
};

export default NavigationBar;
