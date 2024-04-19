import isObject from 'lodash/isObject';
import { notifyError } from '@autonolas/frontend-library';
import { Alert, Typography } from 'antd';
import styled from 'styled-components';

const CustomPre = styled.pre`
  white-space: pre-wrap;
  background-color: none;
  border: none;
  padding: 0;
  margin: 0 !important;
  font-size: 75%;
  .ant-typography {
    position: relative;
    display: inline-block;
    width: 100%;
    .ant-typography-copy {
      position: absolute;
      top: 0px;
      right: 0px;
    }
  }
`;

const getErrorMessage = (error) => {
  if (isObject(error)) {
    if ((error?.message || '').includes('OwnerOnly')) {
      return 'You are not the owner of the component/agent';
    }

    if ((error?.message || '').includes('WrongUnitId')) {
      return 'Unit ID is not valid';
    }

    if ((error?.message || '').includes('ClaimIncentivesFailed')) {
      return 'You do not have any rewards to claim';
    }

    if ((error?.message || '').includes('TransferFailed')) {
      return 'Transfer failed';
    }

    if ((error?.message || '').includes('execution reverted')) {
      return 'Nothing to claim for the connected wallet';
    }

    return error?.message || 'Some error occurred';
  }

  return error || 'Some error occurred';
};

export const getErrorDescription = (desc) => {
  // don't show error if it is due to compute units
  if ((desc || '').includes('app has exceeded its compute units ')) {
    return null;
  }

  return desc;
};

export const notifySpecificError = (error, desc) => {
  const message = getErrorMessage(error);
  const description = getErrorDescription(desc);
  notifyError(message, description);
};

const CONTRACT_ERRORS = [
  {
    message: 'User denied transaction signature',
    toDisplay: 'Transaction rejected by user.',
  },
  {},
];

const errorTypes = {
  contract_types: CONTRACT_ERRORS,
};

export const notifyCustomErrors = (
  error,
  defaultErrorMessageToBeShown,
  types = ['contract_types'],
) => {
  const defaultMessage = defaultErrorMessageToBeShown || 'Some error occurred';

  // get all the errors based on the types passed
  const errorList = types.map((type) => errorTypes[type]).flat();

  const message = errorList.find((cError) =>
    error?.message?.includes(cError.message),
  )?.toDisplay;

  if (message) {
    const errorInString = JSON.stringify(error, null, 2);
    notifyError(
      message,
      <Alert
        message={
          <CustomPre>
            <Typography.Text copyable>{errorInString}</Typography.Text>
          </CustomPre>
        }
        type="error"
      />,
    );
    return;
  }

  notifyError(defaultMessage);
};
