import { TradeType, Currency, Percent } from "@uniswap/sdk-core";
import {FeeOptions } from "@uniswap/v3-sdk";
import { Trade, SwapRouter } from '@uniswap/router-sdk'
import { Trade as V3Trade, SwapRouter as V3SwapRouter } from '@uniswap/v3-sdk'
import { BigNumber } from '@ethersproject/bignumber'
import { CURRENT_CHAIN_ID } from "../config";
import { V3_ROUTER_ADDRESS, SWAP_ROUTER_ADDRESSES } from "../addresses";

export enum PermitType {
    AMOUNT = 1,
    ALLOWED = 2,
}

interface BaseSignatureData {
    v: number
    r: string
    s: string
    deadline: number
    nonce: number
    owner: string
    spender: string
    chainId: number
    tokenAddress: string
    permitType: PermitType
}

interface StandardSignatureData extends BaseSignatureData {
    amount: string
}

interface AllowedSignatureData extends BaseSignatureData {
    allowed: true
}

export type SignatureData = StandardSignatureData | AllowedSignatureData

export type AnyTrade =
    | V3Trade<Currency, Currency, TradeType>
    | Trade<Currency, Currency, TradeType>

interface SwapCall {
    address: string
    calldata: string
    value: string
}

export function useSwapCallArguments(
    trade: AnyTrade | undefined,
    allowedSlippage: Percent,
    recipient: string | undefined | null,
    signatureData: SignatureData | null | undefined,
    deadline: BigNumber | undefined,
    feeOptions: FeeOptions | undefined
): SwapCall[] {
    if (!trade || !recipient || !deadline) return []

    const sharedSwapOptions = {
        fee: feeOptions,
        recipient,
        slippageTolerance: allowedSlippage,
        ...(signatureData
            ? {
                inputTokenPermit:
                    'allowed' in signatureData
                        ? {
                            expiry: signatureData.deadline,
                            nonce: signatureData.nonce,
                            s: signatureData.s,
                            r: signatureData.r,
                            v: signatureData.v as any,
                        }
                        : {
                            deadline: signatureData.deadline,
                            amount: signatureData.amount,
                            s: signatureData.s,
                            r: signatureData.r,
                            v: signatureData.v as any,
                        },
            }
            : {}),
    }


    const swapRouterAddress = CURRENT_CHAIN_ID
        ? trade instanceof V3Trade
            ? V3_ROUTER_ADDRESS[CURRENT_CHAIN_ID]
            : SWAP_ROUTER_ADDRESSES[CURRENT_CHAIN_ID]
        : undefined
    if (!swapRouterAddress) return []

    const { value, calldata } = trade instanceof V3Trade
        ? V3SwapRouter.swapCallParameters(trade, {
            ...sharedSwapOptions,
            deadline: deadline.toString(),
        })
        : SwapRouter.swapCallParameters(trade, {
            ...sharedSwapOptions,
            deadlineOrPreviousBlockhash: deadline.toString(),
        })

    return [
        {
            address: swapRouterAddress,
            calldata,
            value,
        },
    ]
}