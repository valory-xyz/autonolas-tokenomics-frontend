import { createGlobalStyle } from 'styled-components';
import { MEDIA_QUERY, COLOR } from '@autonolas/frontend-library';

const ANTD_COLOR = {
  whiteColor: '#fff',
  borderColor: '#f0f0f0',
};

// const GlobalStyles = styled.div`
const GlobalStyle = createGlobalStyle`
  *,
  :after,
  :before {
    box-sizing: border-box;
  }
  body {
    padding: 0;
  }

  background-size: 100%;
  background-color: ${COLOR.WHITE};

  /* common */
  .m-0 {
    margin: 0 !important;
  }
  .mb-8 {
    margin-bottom: 0.5rem;
  }
  .mb-16 {
    margin-bottom: 1rem;
  }
  .mr-12 {
    margin-right: 12px;
  }
  .mr-24 {
    margin-right: 24px;
  }
  .mr-32 {
    margin-right: 32px;
  }
  .ml-8 {
    margin-left: 8px;
  }
  .ml-16 {
    margin-left: 16px;
  }
  .mt-16 {
    margin-top: 16px;
  }
  .align-right {
    text-align: right;
  }
  .walletconnect-modal__base {
    .walletconnect-modal__mobile__toggle a {
      /* color: ${COLOR.WALLECT_CONNECT_BLUE} !important; */
    }
  }
  .ant-alert {
    border-radius: 5px;
  }
  .show-only-sm {
    display: none;
  }
  .hide-only-sm {
    display: initial;
  }

  /* layout */
  .ant-layout {
    background: ${COLOR.WHITE};
  }
  .ant-layout-header {
    display: flex;
    align-items: center;
    position: fixed;
    z-index: 1;
    width: 100%;
    height: 64px;
    line-height: 64px;
    padding: 0 2rem;
    .ant-menu {
      flex: 1;
      &.ant-menu-horizontal {
        border: none;
      }
      &.ant-menu-horizontal > .ant-menu-item::after,
      .ant-menu-horizontal > .ant-menu-submenu::after {
        border-bottom: none !important;
      }
      .ant-menu-item-selected {
        font-weight: bold;
      }
    }
  }

  /* navigation header menu */
  .ant-menu-horizontal:not(.ant-menu-dark) > .ant-menu-item,
  .ant-menu-horizontal:not(.ant-menu-dark) > .ant-menu-submenu {
    padding: 0 16px;
  }

  /* tabs */
  .ant-tabs-card.ant-tabs-top {
    > .ant-tabs-nav .ant-tabs-tab {
      border-radius: 18px;
      background-color: transparent;
      border-color: transparent !important;
    }
    > .ant-tabs-nav .ant-tabs-tab-active {
      border-bottom-color: ${ANTD_COLOR.borderColor};
      background-color: ${COLOR.GREY_1};
      .ant-tabs-tab-btn {
        color: ${COLOR.BLACK};
      }
    }
  }

  .ant-tabs-top > .ant-tabs-nav::before,
  .ant-tabs-bottom > .ant-tabs-nav::before,
  .ant-tabs-top > div > .ant-tabs-nav::before,
  .ant-tabs-bottom > div > .ant-tabs-nav::before {
    border-bottom: none;
  }

  /* layout */
  .site-layout {
    padding: 0 2rem;
    margin-top: 56px;
    + div {
      padding: 1rem 32px;
    }
  }
  .site-layout-background {
    padding: 24px 0;
    min-height: calc(100vh - 8.5rem);
  }

  ${MEDIA_QUERY.mobileL} {
    .show-only-sm {
      display: initial;
    }
    .hide-only-sm {
      display: none;
    }
  }

  .ant-layout-footer {
    text-align: center;
  }
  .ant-result-title {
    color: ${COLOR.BLACK};
  }

  /* form */
  .ant-form-item-label > label {
    font-weight: bold;
  }
  .custom-form-item-tokenAmount {
    margin-bottom: 4px;
  }

  /* button */
  .ant-btn-danger {
    text-shadow: none;
  }

  /* radio-button for grouping */
  .choose-type-group.ant-typography {
    display: flex;
    align-items: center;
    .ant-radio-group {
      margin-left: 2rem;
      border: 1px solid ${COLOR.BORDER_GREY};
      padding: 2px 16px;
    }
  }

  .ant-tooltip-inner {
    background-color: ${COLOR.BLACK};
  }

  .deposit-tag {
    margin-bottom: 1rem;
    > * {
      color: ${COLOR.WHITE} !important;
    }
  }

  ${MEDIA_QUERY.tablet} {
    body {
      padding: 0rem;
    }
    .ant-layout-header {
      position: relative;
      flex-direction: column;
      height: auto;
      padding: 0;
    }
    .site-layout-background {
      padding: 1rem 0;
      min-height: calc(100vh - 20rem);
    }
    .site-layout {
      margin-top: 0;
    }
  }

  ${MEDIA_QUERY.mobileL} {
    .site-layout {
      padding: 0 1rem;
    }
    .choose-type-group.ant-typography {
      flex-direction: column;
      .ant-radio-group {
        margin-left: 0rem;
      }
    }
  }
`;

export default GlobalStyle;
