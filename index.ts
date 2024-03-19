import { CurrencyAmount, TradeType, Token, Percent } from "@uniswap/sdk-core";
import JSBI from 'jsbi'
import { BigNumber } from '@ethersproject/bignumber'
import { useClientSideV3Trade } from "./hooks/useClientSideV3Trade";
import { useSwapCallback } from "./swap/useSwapCallback";


const CURRENT_USER = "0x73964F6F211D5a8428322EDFbDfEc72FF76D9fCd";

const main = async () => {
  const WETH = new Token(11155111, '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', 18, 'WETH', 'Wrapped Ether');
  const UNI = new Token(11155111, '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 18, 'UNI','Uniswap');

  
  const cgtAmount = CurrencyAmount.fromRawAmount(UNI, JSBI.BigInt('1000000000000000'));

  // // const route = await useAllV3Routes(CGT, DAI);
  // // console.log(route.routes[0].tokenPath);
  const bestTradeV3 = await useClientSideV3Trade(TradeType.EXACT_INPUT, cgtAmount, WETH);

  // const BIPS_BASE = JSBI.BigInt(10000)
  // const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE) // 1%

  // console.log(bestTradeV3.trade?.routes[0].path);

  // const swapCalls = await useSwapCallback(
  //   bestTradeV3.trade,
  //   ALLOWED_PRICE_IMPACT_LOW,
  //   CURRENT_USER,
  //   undefined
  // );

}

main();
// const typedValueParsed = '100000000000000000000'
// const wethAmount = CurrencyAmount.fromRawAmount(WETH, '1000000000000000');
