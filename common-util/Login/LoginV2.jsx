import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Web3 from 'web3';
import PropTypes from 'prop-types';
import { Grid } from 'antd';
import { Web3Modal, Web3Button, Web3NetworkSwitch } from '@web3modal/react';
import {
  useAccount, useNetwork, useBalance, useDisconnect,
} from 'wagmi';
import styled from 'styled-components';
import { COLOR, MEDIA_QUERY } from '@autonolas/frontend-library';

import { setChainId, setUserBalance } from 'store/setup/actions';
import {
  getChainId,
  getChainIdOrDefaultToMainnet,
  isAddressSantioned,
} from 'common-util/functions';
import { projectId, ethereumClient } from './config';

const LoginContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  line-height: normal;
  ${MEDIA_QUERY.mobileL} {
    margin-top: 0.5rem;
  }
`;

const { useBreakpoint } = Grid;

export const LoginV2 = ({
  onConnect: onConnectCb,
  onDisconnect: onDisconnectCb,
  theme = 'light',
}) => {
  const dispatch = useDispatch();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();

  const chainId = chain?.id;
  const { address, connector } = useAccount({
    onConnect: ({ address: currentAddress }) => {
      // console.log('isAddressSantioned', isAddressSantioned(currentAddress));
      if (isAddressSantioned(currentAddress)) {
        disconnect();
      } else if (onConnectCb) {
        onConnectCb({
          address: address || currentAddress,
          balance: null,
          chainId,
        });
      }
    },
    onDisconnect() {
      if (onDisconnectCb) onDisconnectCb();
    },
  });

  const { data } = useBalance({ address });

  useEffect(() => {
    if (data?.formatted) {
      dispatch(setUserBalance(data.formatted));
    }
  }, [data?.formatted]);

  useEffect(() => {
    // if chainId is undefined, the wallet is not connected & default to mainnet
    if (chainId === undefined) {
      /**
       * wait for 100ms to get the chainId & set it to redux to avoid race condition
       * and dependent components are loaded once the chainId is set
       */
      setTimeout(() => {
        const tempChainId = getChainId();
        dispatch(setChainId(tempChainId));
      }, 0);
    } else {
      const tempChainId = getChainIdOrDefaultToMainnet(chainId);
      dispatch(setChainId(tempChainId));
    }
  }, [chainId]);

  useEffect(() => {
    const getData = async () => {
      try {
        // This is the initial `provider` that is returned when
        // using web3Modal to connect. Can be MetaMask or WalletConnect.
        const modalProvider = connector?.options?.getProvider?.()
          || (await connector?.getProvider?.());

        if (modalProvider) {
          // We plug the initial `provider` and get back
          // a Web3Provider. This will add on methods and
          // event listeners such as `.on()` will be different.
          const wProvider = new Web3(modalProvider);

          // *******************************************************
          // ************ setting to the window object! ************
          // *******************************************************
          window.MODAL_PROVIDER = modalProvider;
          window.WEB3_PROVIDER = wProvider;

          if (modalProvider?.on) {
            // https://docs.ethers.io/v5/concepts/best-practices/#best-practices--network-changes
            const handleChainChanged = () => {
              window.location.reload();
            };

            modalProvider.on('chainChanged', handleChainChanged);

            // cleanup
            return () => {
              if (modalProvider.removeListener) {
                modalProvider.removeListener(
                  'chainChanged',
                  handleChainChanged,
                );
              }
            };
          }
        }

        return () => null;
      } catch (error) {
        console.error(error);
        return () => null;
      }
    };

    if (connector && !isAddressSantioned(address)) {
      getData();
    }
  }, [connector]);

  // console.log('address', address);

  const screens = useBreakpoint();

  // Wallet connect shows the address when any address is connected
  // and takes few seconds to disconnect. Hence, if the address is sanctioned
  // 1. hide the login button
  // 2. then the address becomes `null`
  // 3. shows the login button again
  // if (address && isAddressSantioned(address)) return null;

  return (
    <LoginContainer>
      <Web3NetworkSwitch />
      &nbsp;&nbsp;
      <Web3Button
        avatar="hide"
        balance={screens.xs ? 'hide' : 'show'}
        icon={screens.xs ? 'hide' : 'show'}
      />
      <Web3Modal
        projectId={projectId}
        ethereumClient={ethereumClient}
        themeMode={theme}
        themeVariables={{
          '--w3m-button-border-radius': '5px',
          '--w3m-accent-color': COLOR.PRIMARY,
          '--w3m-background-color': COLOR.PRIMARY,
        }}
      />
    </LoginContainer>
  );
};

LoginV2.propTypes = {
  onConnect: PropTypes.func,
  onDisconnect: PropTypes.func,
  theme: PropTypes.string,
};

LoginV2.defaultProps = {
  onConnect: undefined,
  onDisconnect: undefined,
  theme: 'light',
};
