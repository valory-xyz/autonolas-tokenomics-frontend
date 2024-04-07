import Head from 'next/head';
import { createWrapper } from 'next-redux-wrapper';

import PropTypes from 'prop-types';

import Layout from 'components/Layout';
import GlobalStyle from 'components/GlobalStyles';
import { useRouter } from 'next/router';
import initStore from '../store';
import Web3ModalProvider from 'context/Web3ModalProvider';

import { THEME_CONFIG } from 'common-util/constants/constants';

const MyApp = ({ Component, pageProps }) => {
  const router = useRouter();
  const isNotLegal = router.pathname === '/not-legal';

  return (
    <>
      <GlobalStyle />
      <Head>
        <title>Olas Tokenomics</title>
        <meta name="title" content="Olas Tokenomics" />
      </Head>
      <ConfigProvider theme={THEME_CONFIG}>
        {isNotLegal ? (
          <Component {...pageProps} />
        ) : (
          <Web3ModalProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </Web3ModalProvider>
        )}
      </ConfigProvider>
    </>
  );
};

MyApp.propTypes = {
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({})])
    .isRequired,
  pageProps: PropTypes.shape({}).isRequired,
};

const wrapper = createWrapper(initStore);
export default wrapper.withRedux(MyApp);
