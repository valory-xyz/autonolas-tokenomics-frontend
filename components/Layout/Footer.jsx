import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { Grid } from 'antd/lib';
import Link from 'next/link';
import {
  Footer as CommonFooter,
  getChainId,
  isGoerli,
} from '@autonolas/frontend-library';
import { getContractAddress } from 'common-util/Contracts';
import Socials from './Socials';
import { ContractsInfoContainer } from './styles';

const { useBreakpoint } = Grid;

const ContractInfo = () => {
  const chainId = useSelector((state) => state?.setup?.chainId);

  const router = useRouter();

  const [addressChainId, setAddressChainId] = useState(chainId);
  const { pathname } = router;

  // if chainId changes, update the chainId required for address
  useEffect(() => {
    setAddressChainId(chainId);
  }, [chainId]);

  useEffect(() => {
    if (!addressChainId) {
      setAddressChainId(getChainId());
    }
  }, []);

  if (!addressChainId) return <ContractsInfoContainer />;

  const getCurrentPageAddresses = () => {
    if (pathname === '/' || (pathname || '').includes('donate')) {
      return {
        textOne: 'Treasury',
        addressOne: getContractAddress('treasury', addressChainId),
      };
    }

    if ((pathname || '').includes('dev-incentives')) {
      return {
        textOne: 'Tokenomics',
        addressOne: getContractAddress('tokenomics', addressChainId),
        textTwo: 'Dispenser',
        addressTwo: getContractAddress('dispenser', addressChainId),
      };
    }

    if ((pathname || '').includes('bonding-products')) {
      return {
        textOne: 'Depository',
        addressOne: getContractAddress('depository', addressChainId),
      };
    }

    if ((pathname || '').includes('my-bonds')) {
      return {
        textOne: 'Depository',
        addressOne: getContractAddress('depository', addressChainId),
      };
    }

    return { textOne: null, addressOne: null };
  };

  const getEtherscanLink = (address) => {
    if (isGoerli(addressChainId)) {
      return `https://goerli.etherscan.io/address/${address}`;
    }
    return `https://etherscan.io/address/${address}`;
  };

  const getContractInfo = (text, addressToPoint) => (
    <div className="registry-contract">
      <a
        href={getEtherscanLink(addressToPoint)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {text}
      </a>
    </div>
  );

  const {
    textOne, addressOne, textTwo, addressTwo,
  } = getCurrentPageAddresses();

  return (
    <ContractsInfoContainer>
      <img
        alt="Etherscan link"
        width={18}
        height={18}
        src="/images/etherscan-logo.svg"
      />
      <span>Contracts</span>
      &nbsp;•&nbsp;
      {getContractInfo(textOne, addressOne)}
      {textTwo && addressTwo && (
        <>
          &nbsp;•&nbsp;
          {getContractInfo(textTwo, addressTwo)}
        </>
      )}
    </ContractsInfoContainer>
  );
};

const Footer = () => {
  const screens = useBreakpoint();

  return (
    <CommonFooter
      leftContent={<ContractInfo />}
      rightContent={<Socials />}
      centerContent={
        screens.xs ? null : (
          <>
            ©&nbsp;Autonolas DAO&nbsp;
            {new Date().getFullYear()}
            &nbsp;•&nbsp;
            <Link href="/disclaimer">Disclaimer</Link>
            &nbsp;•&nbsp;
            <a
              href="https://gateway.autonolas.tech/ipfs/bafybeibrhz6hnxsxcbv7dkzerq4chssotexb276pidzwclbytzj7m4t47u"
              target="_blank"
              rel="noopener noreferrer"
            >
              DAO constitution
            </a>
          </>
        )
      }
    />
  );
};

export default Footer;
