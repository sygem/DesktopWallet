// @flow

import React, { PureComponent } from 'react';
import styled, { withTheme, keyframes } from 'styled-components';
import { BigNumber } from 'bignumber.js';
import { Transition, animated } from 'react-spring';
import { type Match } from 'react-router-dom';
import eres from 'eres';
import rpc from '../../services/api';

import { FEES } from '../constants/fees';
import { DARK } from '../constants/themes';
import { NODE_SYNC_TYPES } from '../constants/node-sync-types';
import { FETCH_STATE } from '../constants/fetch-states';

import { InputLabelComponent } from '../components/input-label';
import { InputComponent } from '../components/input';
import { TextComponent } from '../components/text';
import { SelectComponent } from '../components/select';
import { SelectSendComponent } from '../components/select-send';
import { RowComponent } from '../components/row';
import { ColumnComponent } from '../components/column';
import { Divider } from '../components/divider';
import { Button } from '../components/button';
import { ConfirmDialogComponent } from '../components/confirm-dialog';
import { LoaderComponent } from '../components/loader';

import { formatNumber } from '../utils/format-number';
import { ascii2hex } from '../utils/ascii-to-hexadecimal';
import { isHex } from '../utils/is-hex';
import { getCoinName } from '../utils/get-coin-name';
import { openExternal } from '../utils/open-external';
import { VIDULUM_EXPLORER_BASE_URL } from '../constants/explorer';

import SentIcon from '../assets/images/transaction_sent_icon_dark.svg';
import MenuIconDark from '../assets/images/menu_icon_dark.svg';
import MenuIconLight from '../assets/images/menu_icon_light.svg';
import ValidIcon from '../assets/images/green_check_dark.png';
import InvalidIcon from '../assets/images/error_icon_dark.png';
import LoadingIconDark from '../assets/images/sync_icon_dark.png';
import LoadingIconLight from '../assets/images/sync_icon_light.png';
import ArrowUpIconDark from '../assets/images/arrow_up_dark.png';
import ArrowUpIconLight from '../assets/images/arrow_up_light.png';

import type { MapDispatchToProps, MapStateToProps } from '../containers/shield';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

const FormWrapper = styled.div`
  width: 71%;
`;

const SendWrapper = styled(ColumnComponent)`
  width: 25%;
  margin-top: 42px;
`;

const Label = styled(InputLabelComponent)`
  text-transform: uppercase;
  color: ${props => props.theme.colors.transactionsDate};
  font-size: ${props => `${props.theme.fontSize.regular * 0.9}em`};
  font-weight: ${props => String(props.theme.fontWeight.bold)};
`;

type AmountProps =
  | {
      isEmpty: boolean,
    }
  | Object;
const AmountWrapper = styled.div`
  width: 100%;
  position: relative;

  &:before {
    content: '${getCoinName()}';
    font-family: ${props => props.theme.fontFamily};
    position: absolute;
    margin-top: 16px;
    margin-left: 15px;
    display: block;
    transition: all 0.05s ease-in-out;
    opacity: ${(props: AmountProps) => (props.isEmpty ? '0' : '1')};
    color: ${props => props.theme.colors.text};
    z-index: 10;
  }
`;

const AmountInput = styled(InputComponent)`
  padding-left: ${(props: AmountProps) => (props.isEmpty ? '15' : '50')}px;
`;

const ShowFeeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  color: ${props => props.theme.colors.text};
  outline: none;
  display: flex;
  align-items: center;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
`;

const SeeMoreIcon = styled.img`
  width: 25px;
  height: 25px;
  border: 1px solid ${props => props.theme.colors.text};
  border-radius: 100%;
  margin-right: 11.5px;
`;

const FeeWrapper = styled.div`
  background-color: ${props => props.theme.colors.sendAdditionalOptionsBg};
  border: 1px solid ${props => props.theme.colors.sendAdditionalOptionsBorder};
  border-radius: ${props => props.theme.boxBorderRadius};
  padding: 0 20px 15px;
  margin-bottom: 20px;
`;

const InfoCard = styled.div`
  width: 100%;
  background-color: ${props => props.theme.colors.sendCardBg};
  border: 1px solid ${props => props.theme.colors.sendCardBorder}
  border-radius: ${props => props.theme.boxBorderRadius};
  margin-bottom: 10px;
`;

const InfoContent = styled.div`
  padding: 15px;
`;

const InfoCardLabel = styled(TextComponent)`
  opacity: 0.5;
  margin-bottom: 10px;
`;

const InfoCardSubLabel = styled(TextComponent)`
  opacity: 0.5;
  margin-top: -7px;
  margin-bottom: 10px;
  font-size: 9px;
`;

const InfoCardUSD = styled(TextComponent)`
  opacity: 0.5;
  margin-top: 2.5px;
`;

const FormButton = styled(Button)`
  width: 100%;
  margin: 5px 0;

  &:first-child {
    margin-top: 0;
  }
`;

const ModalContent = styled(ColumnComponent)`
  min-height: 400px;
  align-items: center;
  justify-content: center;

  p {
    word-break: break-word;
  }
`;

const ConfirmItemWrapper = styled(RowComponent)`
  padding: 22.5px 40px;
  width: 100%;
`;

type ItemLabelProps = {
  color: string,
};
/* eslint-disable max-len */
const ItemLabel = styled(TextComponent)`
  font-weight: ${(props: PropsWithTheme<ItemLabelProps>) => String(props.theme.fontWeight.bold)};
  font-size: ${(props: PropsWithTheme<ItemLabelProps>) => String(props.theme.fontSize.small)};
  color: ${(props: PropsWithTheme<ItemLabelProps>) => props.color || props.theme.colors.modalItemLabel};
  margin-bottom: 3.5px;
`;

const ValidateItemLabel = styled(ItemLabel)`
  margin-bottom: -1px;
`;

const SendVDLValue = styled(TextComponent)`
  color: ${props => props.theme.colors.transactionSent};
  font-size: ${props => `${props.theme.fontSize.large}em`};
  font-weight: ${props => String(props.theme.fontWeight.bold)};
`;

const SendUSDValue = styled(TextComponent)`
  opacity: 0.5;
  font-weight: ${props => String(props.theme.fontWeight.light)};
  font-size: ${props => `${props.theme.fontSize.medium}em`};
`;

const Icon = styled.img`
  width: 35px;
  height: 35px;
  margin-left: 15px;
`;

const ValidateStatusIcon = styled.img`
  width: 13px;
  height: 13px;
  margin-right: 7px;
`;

const RevealsMain = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;

  & > div {
    top: 0;
    right: 0;
    left: 0;
  }
`;

// $FlowFixMe
const Checkbox = styled.input.attrs({
  type: 'checkbox',
})`
  margin-right: 10px;
`;

const MaxAvailableAmount = styled.button`
  margin-top: -15px;
  margin-right: -15px;
  width: 45px;
  height: 48px;
  border: none;
  background: none;
  color: white;
  cursor: pointer;
  border-left: 1px solid ${props => props.theme.colors.inputBorder};
  opacity: 0.8;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 1;
  }
`;

const MaxAvailableAmountImg = styled.img`
  width: 20px;
  height: 20px;
`;

const ValidateWrapper = styled(RowComponent)`
  margin-top: 3px;
`;

const ActionsWrapper = styled(RowComponent)`
  padding: 30px 0;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
`;

const HexadecimalWrapper = styled.div`
  display: flex;
  opacity: 0.7;
  cursor: pointer;

  &:hover {
    opacity: 1;s
  }
`;

const HexadecimalText = styled(TextComponent)`
  white-space: nowrap;
`;

const MemoValidationText = styled(TextComponent)`
  padding: 10px 5px;
  margin: 0px 0 8.5px 0;
  text-transform: uppercase;
  color: ${props => props.theme.colors.transactionSent};
  font-size: 10px;
  font-weight: 700;
`;

const SimpleTooltip = styled.div`
  background: ${props => props.theme.colors.walletAddressTooltipBg};
  position: absolute;
  top: -24px;
  left: 0;
  right: 0;
  padding: 6px 10px;
  border-radius: ${props => props.theme.boxBorderRadius};
`;

const TooltipText = styled(TextComponent)`
  color: ${props => props.theme.colors.walletAddressTooltip};
  font-size: 10px;
  font-weight: 700;
  text-align: center;
`;

const SendButtonWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
`;

const ErrorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 20px 40px;
`;

const ErrorLabel = styled(TextComponent)`
  font-weight: 700;
  font-size: 20px;
  margin-bottom: 16px;
`;

const ErrorMessage = styled(TextComponent)`
  font-size: 14px;
  font-weight: 700;
  color: ${props => props.theme.colors.error};
  text-align: center;
  margin-bottom: 20px;
`;

const LoaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Loader = styled.img`
  width: 45px;
  height: 45px;
  animation: 2s linear infinite;
  animation-name: ${rotate};
  margin-bottom: 30px;
`;

const ZSuccessWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 40px;
`;

const ZSuccessContentWrapper = styled.div`
  padding: 0 0 40px 0;
`;

const ZSuccessLabel = styled(TextComponent)`
  color: ${props => props.theme.colors.success};
  font-weight: 700;
  font-size: 30px;
`;

const ZSuccessMessage = styled(TextComponent)`
  text-align: center;
  margin-bottom: 40px;
  margin-top: 5px;
`;

const ZSuccessTransactionId = styled(TextComponent)`
  text-align: center;
  word-break: break-all !important;

  &:hover {
    cursor: pointer;
    text-decoration: underline;
  }
`;

const CustomFeeWarning = styled(TextComponent)`
  padding: 15px 10px 0 0;
  letter-spacing: 0.5px;
  font-size: 12px;
  color: ${props => props.theme.colors.error};
`;

type Props = {
  match: Match,
  theme: AppTheme,
} & MapStateToProps &
  MapDispatchToProps;

type State = {
  showFee: boolean,
  from: string,
  amount: string,
  to: string,
  feeType: string | number,
  fee: number | null,
  memo: string,
  isHexMemo: boolean,
  showBalanceTooltip: boolean,
  zAddresses: array[],
  generated: array[],
};

const initialState: State = {
  showFee: false,
  from: '',
  amount: '',
  to: '',
  feeType: FEES.LOW,
  fee: FEES.LOW,
  memo: '',
  isHexMemo: false,
  showBalanceTooltip: false,
  zAddresses: [],
  generated: [],
};

class Component extends PureComponent<Props, State> {
  state = initialState;

  componentDidMount() {
    const {
      resetSendView, loadAddresses, loadVDLPrice, match,
    } = this.props;

    resetSendView();
    loadAddresses();
    loadVDLPrice();

    if (match.params.to) {
      this.handleChange('to')(match.params.to);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const previousToAddress = prevProps.match.params.to;
    const toAddress = this.props.match.params.to; // eslint-disable-line

    if (toAddress && previousToAddress !== toAddress) this.handleChange('to')(toAddress);
  }

  updateTooltipVisibility = ({ balance, amount }: { balance: number, amount: number }) => {
    const { from, to, fee } = this.state;
    const feeValue = fee || 0;

    this.setState({
      showBalanceTooltip: !from || !to ? false : new BigNumber(amount).plus(feeValue).gt(balance),
    });
  };

  getZaddresses = async () => {
    const [zAddressesErr, zAddresses = []] = await eres(rpc.z_listaddresses());
    const [blockHeightErr, blockHeight] = await eres(rpc.getblockcount());

    // TODO: Pre sapling activation
    let zAddrs = [];
    if (blockHeight < 430000) {
      zAddrs = zAddresses.filter((address) => address.startsWith('zc'));
    }else {
      zAddrs = zAddresses;
    }

    this.setState({
      zAddresses: zAddrs,
    });
  };

  getGeneratedBalance = async () => {
    const [unspentErr, unspent] = await eres(rpc.listunspent());
    let balances = {};

    // check for generated
    let generatedAmount = 0;
    unspent.map((transaction) => {
      console.log(transaction)
      if (transaction.generated && transaction.confirmations > 100 && transaction.spendable) {
        generatedAmount += Math.abs(transaction.amount);
        if(!balances[transaction.address]){
          balances[transaction.address] = Math.abs(transaction.amount);
        }else{
          balances[transaction.address] += Math.abs(transaction.amount);
        }
        
      }
    });
    const genarray = {
      total: Math.round(generatedAmount * 1000) / 1000,
      balByAddress: balances,
    }
    console.log(JSON.stringify(genarray))
    this.setState({
      generated: genarray,
    });
  };

  getAmountWithFee = () => {
    const { amount, fee } = this.state;

    const feeValue = fee || 0;

    if (!amount) return feeValue;

    return new BigNumber(amount).plus(feeValue).toNumber();
  };

  getMaxAmountWithoutFee = () => {
    const { balance } = this.props;
    const { fee } = this.state;

    const max = new BigNumber(balance).minus(fee || 0);

    return max.isNegative() ? 0 : max.toNumber();
  };

  handleChange = (field: string) => (value: string | number) => {
    const { validateAddress, getAddressBalance, balance } = this.props;
    const { amount } = this.state;

    if (field === 'to') {
      this.setState(
        () => ({ [field]: value }),
        () => {
          validateAddress({ address: String(value) });
          this.updateTooltipVisibility({
            balance,
            amount: new BigNumber(amount).toNumber(),
          });
        },
      );
    } else {
      if (field === 'from') getAddressBalance({ address: String(value) });

      this.setState(
        () => ({ [field]: value }),
        () => {
          if (field === 'fee') this.handleChange('amount')(amount);
          this.updateTooltipVisibility({
            balance,
            amount: new BigNumber(field === 'amount' ? value : amount).toNumber(),
          });
        },
      );
    }
  };

  handleChangeFeeType = (value: string) => {
    const { amount } = this.state;

    if (value === FEES.CUSTOM) {
      this.setState(() => ({
        feeType: FEES.CUSTOM,
        fee: null,
      }));
    } else {
      const fee = new BigNumber(value);

      this.setState(
        () => ({
          feeType: fee.toString(),
          fee: fee.toNumber(),
        }),
        () => this.handleChange('amount')(amount),
      );
    }
  };

  handleSubmit = (toggle: void => void) => {
    const {
      from, to,
    } = this.state;
    const { shieldCoinbase, isToAddressValid } = this.props;

    if (!from || !to || !isToAddressValid) return;

    shieldCoinbase({
      from,
      to,
    });

    toggle();
  };

  showModal = (toggle: void => void) => {
    const {
      from, to,
    } = this.state;
    // eslint-disable-next-line react/prop-types
    const { isToAddressValid } = this.props;

    if (!from || !to || !isToAddressValid) return;

    toggle();
  };

  reset = () => {
    const { resetSendView } = this.props;

    this.setState(initialState, () => resetSendView());
  };

  getFeeText = () => {
    const { fee } = this.state;

    if (!fee) return '0.0';

    const feeValue = new BigNumber(fee);
    const coinName = getCoinName();

    if (feeValue.isEqualTo(FEES.LOW)) return `Low ${coinName} ${feeValue.toString()}`;
    if (feeValue.isEqualTo(FEES.MEDIUM)) return `Medium ${coinName} ${feeValue.toString()}`;
    if (feeValue.isEqualTo(FEES.HIGH)) return `High ${coinName} ${feeValue.toString()}`;

    return `Custom ${coinName} ${feeValue.toString()}`;
  };

  renderValidationStatus = () => {
    const { isToAddressValid, theme } = this.props;

    return isToAddressValid ? (
      <ValidateWrapper alignItems='center'>
        <ValidateStatusIcon src={ValidIcon} />
        <ValidateItemLabel value='VALID' color={theme.colors.transactionReceived(this.props)} />
      </ValidateWrapper>
    ) : (
      <ValidateWrapper alignItems='center'>
        <ValidateStatusIcon src={InvalidIcon} />
        <ValidateItemLabel value='INVALID' color={theme.colors.transactionSent(this.props)} />
      </ValidateWrapper>
    );
  };

  getLoadingIcon = () => {
    const { theme } = this.props;

    return theme.mode === DARK ? LoadingIconDark : LoadingIconLight;
  };

  renderModalContent = ({
    valueSent,
    valueSentInUsd,
    toggle,
  }: {
    /* eslint-disable react/no-unused-prop-types */
    valueSent: string,
    valueSentInUsd: string,
    toggle: () => void,
    /* eslint-enable react/no-unused-prop-types */
  }) => {
    // eslint-disable-next-line react/prop-types
    const { operationId, isSending, error } = this.props;
    const { from, to } = this.state;

    const loadingIcon = this.getLoadingIcon();
    if (isSending) {
      return (
        <LoaderWrapper>
          <Loader src={loadingIcon} />
          <TextComponent value='Shielding Coins...' />
        </LoaderWrapper>
      );
    }

    if (operationId) {
      return (
        <ZSuccessWrapper id='send-success-wrapper'>
          <ZSuccessLabel value='Success!' />
          <ZSuccessContentWrapper>
            <ZSuccessMessage value='Shielding was successful.' />
            <ZSuccessTransactionId value={`Transaction ID: ${operationId}`} onClick={() => openExternal(VIDULUM_EXPLORER_BASE_URL + operationId)} />
          </ZSuccessContentWrapper>
          <FormButton
            label='Done'
            variant='primary'
            onClick={() => {
              this.reset();
              toggle();
            }}
          />
        </ZSuccessWrapper>
      );
    }

    if (error) {
      return (
        <ErrorWrapper>
          <ErrorLabel value='Error' />
          <ErrorMessage id='send-error-message' value={error} />
          <FormButton
            label='Try Again'
            variant='primary'
            onClick={() => {
              this.reset();
              toggle();
            }}
          />
        </ErrorWrapper>
      );
    }

    return (
      <>
        <ConfirmItemWrapper alignItems='center'>
          <ColumnComponent>
            <ItemLabel value='FROM' />
            <TextComponent value={from} />
          </ColumnComponent>
        </ConfirmItemWrapper>
        <Divider opacity={0.3} />
        <ConfirmItemWrapper alignItems='center'>
          <ColumnComponent>
            <ItemLabel value='TO' />
            <TextComponent value={to} />
          </ColumnComponent>
        </ConfirmItemWrapper>
        <Divider opacity={0.3} marginBottom='27.5px' />
      </>
    );
  };

  shouldDisableShieldButton = () => {
    const { isToAddressValid, nodeSyncType } = this.props;
    const {
      from, to,
    } = this.state;

    return (
      !from
      || !to
      || !from
      || !isToAddressValid
      || nodeSyncType !== NODE_SYNC_TYPES.READY
    );
  };

  componentWillMount = () => {
    this.getZaddresses();
    this.getGeneratedBalance();
  };

  render() {
    const {
      addresses,
      balance,
      vdlPrice,
      isSending,
      error,
      operationId,
      theme,
      nodeSyncType,
      fetchState,
    } = this.props;
    const {
      zAddresses,
      generated,
      amount,
      from,
      to,
      showBalanceTooltip,
    } = this.state;

    if (fetchState === FETCH_STATE.INITIALIZING) {
      return <LoaderComponent />;
    }

    const isEmpty = amount === '';

    const fixedAmount = isEmpty || new BigNumber(amount).eq(0) ? 0 : this.getAmountWithFee();
    const coinName = getCoinName();

    const vdlBalanceInUsd = formatNumber({
      value: new BigNumber(generated.total).times(vdlPrice).toNumber(),
      append: 'USD $',
    });
    const valueSent = formatNumber({
      value: new BigNumber(fixedAmount).toFormat(4),
      append: `${coinName} `,
    });
    const valueSentInUsd = formatNumber({
      value: new BigNumber(fixedAmount).times(vdlPrice).toNumber(),
      append: 'USD $',
    });

    return (
      <RowComponent id='send-wrapper' justifyContent='space-between'>
        <FormWrapper>
        <Label value='Shield coins from:' />
          <SelectSendComponent
            onChange={value => this.setState({ from: `${value}`})}
            value={from}
            placeholder='From Address'
            options={generated.balByAddress.map(({ address, balance: addressBalance }) => ({
              label: `[ ${formatNumber({
                append: `${coinName} `,
                value: addressBalance,
              })} ]  ${address}`,
              value: address,
            }))}
            capitalize={false}
          />
          <Label value='Shield coins to:' />
          <SelectSendComponent
            onChange={this.handleChange('to')}
            value={to}
            placeholder='Select a private address'
            options={zAddresses.map(address => ({
              label: `${address}`,
              value: address,
            }))}
            capitalize={false}
          />
        </FormWrapper>
        <SendWrapper>
          <InfoCard>
            <InfoContent>
              <InfoCardLabel value='VDL Requiring Shielding' />
              <TextComponent value={generated.total} size={2.25} isBold />
              <InfoCardUSD value={vdlBalanceInUsd} size={0.84375} />
            </InfoContent>
          </InfoCard>
          <ConfirmDialogComponent
            title='Shielding Transaction Details'
            showButtons={!isSending && !error && !operationId}
            onClose={this.reset}
            renderTrigger={toggle => (
              <SendButtonWrapper>
                {nodeSyncType !== NODE_SYNC_TYPES.READY && (
                  <SimpleTooltip>
                    <TooltipText value='Cannot send until data is synced.' />
                  </SimpleTooltip>
                )}
                {!showBalanceTooltip ? null : (
                  <SimpleTooltip>
                    <TooltipText value='Not enough funds!' />
                  </SimpleTooltip>
                )}
                <FormButton
                  onClick={() => this.handleSubmit(toggle)}
                  id='send-submit-button'
                  label='Shield Coins'
                  variant='primary'
                  focused
                  isFluid
                  disabled={this.shouldDisableShieldButton()}
                />
              </SendButtonWrapper>
            )}
          >
            {toggle => (
              <ModalContent id='send-confirm-transaction-modal' width='100%'>
                {this.renderModalContent({
                  valueSent,
                  valueSentInUsd,
                  toggle,
                })}
              </ModalContent>
            )}
          </ConfirmDialogComponent>
          <FormButton label='Clear Form' variant='secondary' onClick={this.reset} />
        </SendWrapper>
      </RowComponent>
    );
  }
}

export const ShieldView = withTheme(Component);
