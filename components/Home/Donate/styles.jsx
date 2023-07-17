import styled from 'styled-components';
import { COLOR } from '@autonolas/frontend-library';

export const DonateContainer = styled.div`
  display: flex;
  .donate-section {
    width: 720px;
  }
  .last-epoch-section {
    padding-left: 1rem;
    margin-left: 1rem;
    border-left: 1px solid ${COLOR.BORDER_GREY}
  }
`;
