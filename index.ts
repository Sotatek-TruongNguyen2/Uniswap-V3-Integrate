import "dotenv/config";
import {
  Currency,
  CurrencyAmount,
  TradeType,
  Token,
  Percent,
  NativeCurrency,
} from "@uniswap/sdk-core";
import { ethers } from "ethers";
import JSBI from "jsbi";
import { CURRENT_CHAIN_ID } from "./config";
import { useClientSideV3Trade } from "./hooks/useClientSideV3Trade";
import { nativeOnChain } from "./tokens";

const main = async () => {
  const USDC = new Token(
    5,
    "0x07865c6e87b9f70255377e024ace6630c1eaa37f",
    6,
    "USDC",
    "USD//C"
  );
  // const WETH = new Token(
  //   5,
  //   "0xc778417e063141139fce010982780140aa0cd5ab",
  //   18,
  //   "WETH",
  //   "Wrapped Ether"
  // );
  // const DAI = new Token(
  //   5,
  //   "0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735",
  //   18,
  //   "DAI",
  //   "Dai Stablecoin"
  // );
  // const UNI = new Token(
  //   5,
  //   "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  //   18,
  //   "UNI",
  //   "Uniswap"
  // );

  // Choose slippage as 0.5%
  const CHOSEN_SLIPPAGE = 0.5;
  const ETH = nativeOnChain(CURRENT_CHAIN_ID);

  const usdcAmount = CurrencyAmount.fromRawAmount(
    USDC,
    JSBI.BigInt("100000000000000000")
  );
  // const nativeAmount = CurrencyAmount.fromRawAmount(
  //   ETH,
  //   JSBI.BigInt("1000000000000000")
  // );
  const ourTradeType = TradeType.EXACT_INPUT;

  const bestTradeV3 = await useClientSideV3Trade(ourTradeType, usdcAmount, ETH);

  const BIPS_BASE = JSBI.BigInt(10000);

  const convertToPercent = (number: number) => {
    const ALLOWED_SLIPPAGE: Percent = new Percent(
      JSBI.BigInt(number * 100),
      BIPS_BASE
    ); // 0.5%

    return ALLOWED_SLIPPAGE;
  };

  if (bestTradeV3 && bestTradeV3.trade) {
    const trade = bestTradeV3.trade;
    const { inputAmount, outputAmount, executionPrice, priceImpact } =
      bestTradeV3.trade;
    const { pools, path } = bestTradeV3.trade?.routes[0];

    const preparedSwapData = {
      path: path?.map((path) => path.name),
      tokenPath: path?.map((path) => path.address),
      inputAmount: inputAmount.toFixed(),
      outputAmount: outputAmount.toFixed(),
      // executionPrice => token price - 1 token input = ? token output
      // can be invert using `invert`
      executionPrice: executionPrice.toFixed(),
      poolFees: pools.map((pool: any) => pool.fee),
      priceImpact: priceImpact.toFixed(),
      // output/input amount after apply slippage tolerance
      amountAfterSlippage:
        ourTradeType == TradeType.EXACT_INPUT
          ? trade
              .minimumAmountOut(convertToPercent(CHOSEN_SLIPPAGE), outputAmount)
              .toFixed()
          : trade
              .maximumAmountIn(convertToPercent(CHOSEN_SLIPPAGE), inputAmount)
              .toFixed(),
    };

    console.log(preparedSwapData);
  }
};

main();
// const typedValueParsed = '100000000000000000000'
// const wethAmount = CurrencyAmount.fromRawAmount(WETH, '1000000000000000');
