import { CurrencyAmount, TradeType, Token, Percent } from "@uniswap/sdk-core";
import JSBI from 'jsbi'
import { BigNumber } from '@ethersproject/bignumber'
import { useClientSideV3Trade } from "./hooks/useClientSideV3Trade";
import { useSwapCallback } from "./swap/useSwapCallback";


const CURRENT_USER = "0x73964F6F211D5a8428322EDFbDfEc72FF76D9fCd";

const main = async () => {
  const CGT = new Token(4, '0xA739e45E6aEDf91e1B4D92b0331162b603246982', 18, 'CGT', 'CGT');
  const WETH = new Token(4, '0xc778417e063141139fce010982780140aa0cd5ab', 18, 'WETH', 'Wrapped Ether');
  const DAI = new Token(4, '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735', 18, 'DAI', 'Dai Stablecoin');
  const UNI = new Token(4, '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 18, 'UNI','Uniswap');
  
  const cgtAmount = CurrencyAmount.fromRawAmount(CGT, JSBI.BigInt('1000000000000000'));

  // const route = await useAllV3Routes(CGT, DAI);
  // console.log(route.routes[0].tokenPath);
  const bestTradeV3 = await useClientSideV3Trade(TradeType.EXACT_INPUT, cgtAmount, DAI);

  const BIPS_BASE = JSBI.BigInt(10000)
  const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE) // 1%

  console.log(bestTradeV3.trade?.routes[0].path);

  const swapCalls = await useSwapCallback(
    bestTradeV3.trade,
    ALLOWED_PRICE_IMPACT_LOW,
    CURRENT_USER,
    undefined
  );

}

main();
// const typedValueParsed = '100000000000000000000'
// const wethAmount = CurrencyAmount.fromRawAmount(WETH, '1000000000000000');
