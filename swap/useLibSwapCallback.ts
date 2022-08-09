import { TransactionResponse } from '@ethersproject/providers'
import { Percent } from '@uniswap/sdk-core'
import { FeeOptions } from '@uniswap/v3-sdk'
import { BigNumber, ethers } from 'ethers'
import { CURRENT_CHAIN_ID } from '../config'
import useSendSwapTransaction from './useSendSwapTransaction'
import { AnyTrade, SignatureData, useSwapCallArguments } from './useSwapCallArguments'

const privateKey = Buffer.from("54516da687bfa7ba7c115d3ed3155a099e0b40f89560a9e3dfb4d34ab1d61579", "hex")
const CURRENT_USER = "0x73964F6F211D5a8428322EDFbDfEc72FF76D9fCd";
const web3Provider = new ethers.providers.JsonRpcProvider('https://rinkeby.infura.io/v3/d0151169c69948a884ef91d59c96c1d9')
const wallet = new ethers.Wallet(privateKey, web3Provider);

export enum SwapCallbackState {
    INVALID,
    LOADING,
    VALID,
}

interface UseSwapCallbackReturns {
    state: SwapCallbackState
    callback?: () => Promise<TransactionResponse>
    error?: string
}

interface UseSwapCallbackArgs {
    trade: AnyTrade | undefined // trade to execute, required
    allowedSlippage: Percent // in bips
    recipient: string | null | undefined // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
    signatureData: SignatureData | null | undefined
    deadline: BigNumber | undefined
    feeOptions?: FeeOptions
  }
  

export function useLibSwapCallBack({
    trade,
    allowedSlippage,
    recipient,
    signatureData,
    deadline,
    feeOptions,
}: UseSwapCallbackArgs): any {
    const swapCalls = useSwapCallArguments(
        trade,
        allowedSlippage,
        recipient,
        signatureData,
        deadline,
        feeOptions
    )
    const { callback } = useSendSwapTransaction(CURRENT_USER, CURRENT_CHAIN_ID, web3Provider, wallet, trade, swapCalls)

    if (!trade || !web3Provider || !CURRENT_USER || !CURRENT_CHAIN_ID || !callback) {
        return { state: SwapCallbackState.INVALID, error: "Missing dependencies<" }
    }

    return {
        state: SwapCallbackState.VALID,
        callback: async () => callback(),
    }
}