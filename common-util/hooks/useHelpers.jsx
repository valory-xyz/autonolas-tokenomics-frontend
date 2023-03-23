// import { useState } from 'react';
import { useSelector } from 'react-redux';
// import { fetchMappedBalances } from 'store/setup/actions';
// import { parseToEth } from 'common-util/functions';

export const useHelpers = () => {
  // const dispatch = useDispatch();
  const account = useSelector((state) => state?.setup?.account);
  const chainId = useSelector((state) => state?.setup?.chainId);

  // const getData = () => {
  // dispatch(fetchMappedBalances());
  // };

  // useEffect(() => {
  //   const fn = async () => {
  //     if (account && chainId) {
  //       setIsLoading(true);
  //       try {
  //         getData();
  //       } catch (error) {
  //         window.console.error(error);
  //       } finally {
  //         setIsLoading(false);
  //       }
  //     }
  //   };
  //   fn();
  // }, [account, chainId]);

  return {
    account,
    chainId,
  };
};
