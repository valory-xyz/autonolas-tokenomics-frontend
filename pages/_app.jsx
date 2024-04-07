import Head from 'next/head';
import { createWrapper } from 'next-redux-wrapper';
import { ConfigProvider } from 'antd';
import PropTypes from 'prop-types';

/** antd theme config */
import Layout from 'components/Layout';
import GlobalStyle from 'components/GlobalStyles';
import { THEME_CONFIG } from '@autonolas/frontend-library';
import { useRouter } from 'next/router';
import Web3ModalProvider from '../context/Web3ModalProvider';
import initStore from '../store';

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

MyApp.getStaticProps = async ({ Component, ctx }) => {
  const pageProps = Component.getStaticProps
    ? await Component.getStaticProps(ctx)
    : {};

  return { pageProps };
};

MyApp.propTypes = {
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({})])
    .isRequired,
  pageProps: PropTypes.shape({}).isRequired,
};

const wrapper = createWrapper(initStore);
export default wrapper.withRedux(MyApp);
