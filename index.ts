import { Currency, CurrencyAmount, TradeType, Token, Percent } from "@uniswap/sdk-core";
import JSBI from 'jsbi'
import { useClientSideV3Trade } from "./hooks/useClientSideV3Trade";

const main = async () => {
  const CGT = new Token(4, '0xA739e45E6aEDf91e1B4D92b0331162b603246982', 18, 'CGT', 'CGT');
  const WETH = new Token(4, '0xc778417e063141139fce010982780140aa0cd5ab', 18, 'WETH', 'Wrapped Ether');
  const DAI = new Token(4, '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735', 18, 'DAI', 'Dai Stablecoin');
  const UNI = new Token(4, '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 18, 'UNI','Uniswap');
  
  const cgtAmount = CurrencyAmount.fromRawAmount(CGT, JSBI.BigInt('100000000000000000'));
  const tradeType = TradeType.EXACT_INPUT;

  const bestTradeV3 = await useClientSideV3Trade(tradeType, cgtAmount, DAI);
  
  const BIPS_BASE = JSBI.BigInt(10000)
  const ALLOWED_SLIPPAGE: Percent = new Percent(JSBI.BigInt(50), BIPS_BASE) // 0.5%

  if (bestTradeV3  && bestTradeV3.trade) {
    const trade = bestTradeV3.trade;
    const { 
      inputAmount, 
      outputAmount, 
      executionPrice, 
      priceImpact, 
    } = bestTradeV3.trade;
    const {pools, path} = bestTradeV3.trade?.routes[0];

    const preparedSwapData = {
      path: path?.map(path => path.name),
      tokenPath: path?.map(path => path.address),
      inputAmount: inputAmount.toFixed(),
      outputAmount: outputAmount.toFixed(),
      // executionPrice => token price - 1 token input = ? token output
      // can be invert using `invert` 
      executionPrice: executionPrice.toFixed(), 
      poolFees: pools.map((pool: any) => pool.fee),
      priceImpact: priceImpact.toFixed(),
      // output/input amount after apply slippage tolerance 
      amountAfterSlippage: tradeType == TradeType.EXACT_INPUT ? trade.minimumAmountOut(ALLOWED_SLIPPAGE, outputAmount).toFixed(): trade.maximumAmountIn(ALLOWED_SLIPPAGE, inputAmount).toFixed()
    }

    console.log(preparedSwapData);
  }
}

main();
// const typedValueParsed = '100000000000000000000'
// const wethAmount = CurrencyAmount.fromRawAmount(WETH, '1000000000000000');
