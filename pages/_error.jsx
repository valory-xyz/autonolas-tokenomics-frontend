'use client';

import { Typography } from 'antd';
import PropTypes from 'prop-types';

import { useEffect } from 'react';

const Error = ({ message, statusCode }) => {
  useEffect(() => {
    console.error(
      statusCode
        ? `An error ${statusCode} occurred on server`
        : 'An error occurred on client',
    );
  }, [statusCode, message]);

  return (
    <div>
      <Typography.Title level={2}>{message}</Typography.Title>
    </div>
  );
};

Error.getInitialProps = ({ response, error }) => {
  const getStatusCode = () => {
    if (response) return response.statusCode;
    if (error) return error.statusCode;
    return 404;
  };

  return { error: { message: error.message, statusCode: getStatusCode() } };
};

Error.propTypes = {
  message: PropTypes.string,
  statusCode: PropTypes.number,
};

Error.defaultProps = {
  message: 'Something went wrong!',
  statusCode: 404,
};

export default Error;
