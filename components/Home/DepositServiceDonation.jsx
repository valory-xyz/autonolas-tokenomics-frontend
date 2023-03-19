import React from 'react';
import { DynamicFieldsForm } from 'common-util/DynamicFieldsForm';

export const DepositServiceDonation = () => {
  console.log('HEY!');
  const [state, setState] = React.useState(0);

  return (
    <div>
      <DynamicFieldsForm />
    </div>
  );
};
