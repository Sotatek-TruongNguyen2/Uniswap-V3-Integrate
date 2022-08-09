import { Percent } from "@uniswap/sdk-core";

import { BigNumber } from '@ethersproject/bignumber'
import { SwapCallbackState, useLibSwapCallBack } from "./useLibSwapCallback";
import { AnyTrade, SignatureData } from "./useSwapCallArguments";

export async function useSwapCallback(
    trade: AnyTrade | undefined, // trade to execute, required
    allowedSlippage: Percent, // in bips
    recipientAddress: string | undefined | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
    signatureData: SignatureData | undefined | null
  ): Promise<{ state: SwapCallbackState; callback: null | (() => Promise<string>); error: string }> {
    const deadline = BigNumber.from(Math.floor(Date.now() / 1000) + 3000);
  
    const {
      state,
      callback: libCallback,
      error,
    } = useLibSwapCallBack({
      trade,
      allowedSlippage,
      signatureData,
      deadline,
      recipient: recipientAddress
    })
  
    const callSwap = async () => {
      if (!libCallback || !trade) {
        return null;
      }
      const response = await libCallback();
      console.log(response);
      return response;
    };
  
    const callback = await callSwap();
   
    return {
      state,
      callback,
      error,
    }
  };
  