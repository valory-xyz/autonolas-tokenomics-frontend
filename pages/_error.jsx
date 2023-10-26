import { Result, Button } from 'antd';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';

const ErrorPage = ({ statusCode }) => {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <Result
      status={statusCode}
      title={
        statusCode === 451
          ? 'Unavailable For Legal Reasons'
          : 'Oops! Something went wrong.'
      }
      subTitle={
        statusCode === 451
          ? 'This content is not available in your country due to legal reasons.'
          : 'Please try again later.'
      }
      extra={(
        <Button type="primary" onClick={handleBack}>
          Go Back
        </Button>
      )}
    />
  );
};

ErrorPage.getInitialProps = ({ res, err }) => {
  if (res?.statusCode) return { statusCode: res.statusCode };
  if (err?.statusCode) return { statusCode: err.statusCode };
  return { statusCode: 404 };
};

ErrorPage.defaultProps = {
  statusCode: 404,
};

ErrorPage.propTypes = {
  statusCode: PropTypes.number,
};

export default ErrorPage;
