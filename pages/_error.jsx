'use client';

import { Button, Typography } from 'antd';
import PropTypes from 'prop-types';

import { useEffect } from 'react';

export const Error = ({ error, reset }) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <Typography.Title level={2}>Something went wrong!</Typography.Title>
      <Button
        onClick={reset} // Attempt to recover by trying to re-render the segment
      >
        Try again
      </Button>
    </div>
  );
};

Error.propTypes = {
  error: PropTypes.shape({ message: PropTypes.string }),
  reset: PropTypes.func,
};

Error.defaultProps = {
  error: null,
  reset: () => {},
};
