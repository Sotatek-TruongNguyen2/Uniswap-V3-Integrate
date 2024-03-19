import { TransactionResponse } from '@ethersproject/providers'
import { Percent } from '@uniswap/sdk-core'
import { FeeOptions } from '@uniswap/v3-sdk'
import { BigNumber, ethers } from 'ethers'
import { CURRENT_CHAIN_ID } from '../config'
import useSendSwapTransaction from './useSendSwapTransaction'
import { AnyTrade, SignatureData, useSwapCallArguments } from './useSwapCallArguments'

const privateKey = Buffer.from("345084502b2d36ea542d0e68ebd682ebf92dddfcafbe597efead47d1949b8afd", "hex")
const CURRENT_USER = "0xd6F8595B0a1808dA9b529Da525F1101716618D1A";
const web3Provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/fc9e3df5e54f41968f36d42f4068c255')
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