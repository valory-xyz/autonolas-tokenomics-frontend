import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Footer as CommonFooter,
  getChainId,
  isGoerli,
} from '@autonolas/frontend-library';
import { getContractAddress } from 'common-util/Contracts';
import Socials from './Socials';
import { ContractsInfoContainer } from './styles';

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

const Footer = () => (
  <CommonFooter
    leftContent={<ContractInfo />}
    rightContent={<Socials />}
    centerContent={(
      <>
        ©&nbsp;Autonolas DAO&nbsp;
        {new Date().getFullYear()}
        &nbsp;•&nbsp;
        <Link href="/disclaimer">Disclaimer</Link>
      </>
    )}
  />
);

export default Footer;
