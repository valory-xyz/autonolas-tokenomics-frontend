import React from 'react';
import { Result } from 'antd';

const NotLegal = () => (
  <Result
    status="error"
    title="Your country is not allowed to access this website due to legal reasons"
  />
);

export default NotLegal;
