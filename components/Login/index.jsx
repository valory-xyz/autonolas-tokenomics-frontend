import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAccount, useBalance } from 'wagmi';
import {
  setUserAccount,
  setUserBalance,
  setErrorMessage,
  setLogout,
} from 'store/setup/actions';
import { LoginV2 } from 'common-util/Login';

const Login = () => {
  const dispatch = useDispatch();
  const { address } = useAccount();
  const balance = useBalance();

  useEffect(() => {
    if (address) {
      dispatch(setUserAccount(address));
      dispatch(setUserBalance(balance));
    } else {
      dispatch(setLogout());
    }
  }, [address]);

  const onConnect = (response) => {
    dispatch(setUserAccount(response.address));
    dispatch(setUserBalance(response.balance));
  };

  const onDisconnect = () => {
    dispatch(setLogout());
  };

  const onError = (error) => {
    dispatch(setErrorMessage(error));
  };

  return (
    <div>
      <LoginV2
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onError={onError}
      />
    </div>
  );
};

export default Login;
