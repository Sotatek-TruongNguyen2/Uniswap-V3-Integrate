import "dotenv/config";
import {
  Currency,
  CurrencyAmount,
  TradeType,
  Token,
  Percent,
} from "@uniswap/sdk-core";
import { ethers } from "ethers";
import JSBI from "jsbi";
import { CURRENT_CHAIN_ID } from "./config";
import { useClientSideV3Trade } from "./hooks/useClientSideV3Trade";
import { useSwapCallback } from "./swap/useSwapCallback";
import { SwapRouter, SwapOptions } from '@uniswap/v3-sdk';
import { SWAP_ROUTER_ADDRESSES } from "./addresses";
import { Trade } from "@uniswap/v3-sdk";
import { nativeOnChain } from "./tokens";
import { NativeCurrency } from "./NativeCurrency";


const CURRENT_USER = "0xd6F8595B0a1808dA9b529Da525F1101716618D1A";
const RECIPIENT = "0xd6F8595B0a1808dA9b529Da525F1101716618D1A";
const CHAIN_ID = 11155111;


const main = async () => {
  const ETH = NativeCurrency.onChain(CHAIN_ID);

  const WETH = new Token(CHAIN_ID, '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', 18, 'WETH', 'Wrapped Ether');
  const UNI = new Token(CHAIN_ID, '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 18, 'UNI', 'Uniswap');


  console.log("ETH: ", ETH);
  const cgtAmount = CurrencyAmount.fromRawAmount(ETH, JSBI.BigInt('10000000000000000'));

  const options: SwapOptions = {
    slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
    deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
    recipient: RECIPIENT,
  }

  // // const route = await useAllV3Routes(CGT, DAI);
  // // console.log(route.routes[0].tokenPath);
  const bestTradeV3 = await useClientSideV3Trade(TradeType.EXACT_INPUT, cgtAmount, UNI);

  const BIPS_BASE = JSBI.BigInt(10000)
  const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE) // 1%

  console.log(bestTradeV3.trade?.routes[0].path);
  console.log("Best Trade: ", bestTradeV3);

  //@ts-ignore
  const methodParameters = SwapRouter.swapCallParameters([bestTradeV3.trade], options);
  console.log("methodParameters: ", methodParameters);

  
  // const tx = {
  //   data: methodParameters.calldata,
  //   to: SWAP_ROUTER_ADDRESSES[CHAIN_ID],
  //   value: methodParameters.value,
  //   from: RECIPIENT,
  //   // maxFeePerGas: MAX_FEE_PER_GAS,
  //   // maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  // }
  
  // const response = await signer.sendTransaction(tx);
  // console.log(response);

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
