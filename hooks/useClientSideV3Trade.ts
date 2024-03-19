import { CurrencyAmount, TradeType, Currency, Token } from "@uniswap/sdk-core";
import { Route } from "@uniswap/v3-sdk";
import { Trade } from '@uniswap/router-sdk'
import { Route as V2Route } from '@uniswap/v2-sdk'
import { Route as V3Route, SwapQuoter } from '@uniswap/v3-sdk'
import { ethers } from "ethers";
import JSBI from 'jsbi'
import { Contract } from "ethers";
import { useAllV3Routes } from "./useAllV3Routes";
import { useQuoter } from "./useContract";
import { QUOTER_ADDRESSES } from "../addresses";
import { CURRENT_CHAIN_ID, MULTICALL_ADDRESS } from "../config";
import QuoterJson from '@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json'
import { toCallState } from "../utils/callState"
import MulticallABI from '../abi/multicall.json';

const { abi: QuoterV2ABI } = QuoterJson

const web3Provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/fc9e3df5e54f41968f36d42f4068c255')

export enum TradeState {
    LOADING,
    INVALID,
    NO_ROUTE_FOUND,
    VALID,
    SYNCING,
  }
  
  export class InterfaceTrade<
    TInput extends Currency,
    TOutput extends Currency,
    TTradeType extends TradeType
  > extends Trade<TInput, TOutput, TTradeType> {
    gasUseEstimateUSD: CurrencyAmount<Token> | null | undefined
  
    constructor({
      gasUseEstimateUSD,
      ...routes
    }: {
      gasUseEstimateUSD?: CurrencyAmount<Token> | undefined | null
      v2Routes: {
        routev2: V2Route<TInput, TOutput>
        inputAmount: CurrencyAmount<TInput>
        outputAmount: CurrencyAmount<TOutput>
      }[]
      v3Routes: {
        routev3: V3Route<TInput, TOutput>
        inputAmount: CurrencyAmount<TInput>
        outputAmount: CurrencyAmount<TOutput>
      }[]
      tradeType: TTradeType
    }) {
      super(routes)
      this.gasUseEstimateUSD = gasUseEstimateUSD
    }
  }

  export async function useClientSideV3Trade<TTradeType extends TradeType>(
    tradeType: TTradeType,
    amountSpecified?: CurrencyAmount<Currency>,
    otherCurrency?: Currency
  ): Promise<{ state: TradeState; trade: InterfaceTrade<Currency, Currency, TTradeType> | undefined }> {
    

    const [currencyIn, currencyOut] =
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency]


    

    // console.log('currency in: ', currencyIn);
    // console.log('currency out: ', currencyOut);

    const { routes, loading: routesLoading } = await useAllV3Routes(currencyIn, currencyOut)
    
    // Chains deployed using the deploy-v3 script only deploy QuoterV2.
    const quoter = useQuoter(web3Provider, undefined) as Contract;
    const quoterAddress = QUOTER_ADDRESSES[CURRENT_CHAIN_ID];
    
    const getCallData = () => {
      return amountSpecified
        ? routes.map(
          (route) => {
            return {
              callData: SwapQuoter.quoteCallParameters(route, amountSpecified, tradeType, { useQuoterV2: true }).calldata,
              target: quoterAddress
            }
          }
        )
        : [];
    }
  
    const multiCall = new ethers.Contract(MULTICALL_ADDRESS, MulticallABI, web3Provider);
    const callDatas = getCallData();
    console.log("callDatas: ", callDatas);
    let quotesResults = await multiCall.aggregate(callDatas);

    console.log("quotesResults: ", quotesResults);

    quotesResults = quotesResults.returnData.map((result: any) => {
      return {
        data: result == "0x" ? undefined : result,
        valid: result != "0x",
      }
    });
  
    quotesResults = quotesResults.map((quotesResult: any) => toCallState(quotesResult, new ethers.utils.Interface(QuoterV2ABI), quoter?.interface?.getFunction(callDatas[0].callData.substring(0, 10)), undefined));
  
    if (
      !amountSpecified ||
      !currencyIn ||
      !currencyOut ||
      quotesResults.some(({ valid }: any) => !valid) ||
      // skip when tokens are the same
      (tradeType === TradeType.EXACT_INPUT
        ? amountSpecified.currency.equals(currencyOut)
        : amountSpecified.currency.equals(currencyIn))
    ) {
      return {
        state: TradeState.INVALID,
        trade: undefined,
      }
    }
  
    const { bestRoute, amountIn, amountOut } = quotesResults.reduce(
      (
        currentBest: {
          bestRoute: Route<Currency, Currency> | null
          amountIn: CurrencyAmount<Currency> | null
          amountOut: CurrencyAmount<Currency> | null
        },
        { result }: any,
        i: number
      ) => {
        if (!result) return currentBest
  
        // overwrite the current best if it's not defined or if this route is better
        if (tradeType === TradeType.EXACT_INPUT) {
          const amountOut = CurrencyAmount.fromRawAmount(currencyOut, result.amountOut.toString())
          if (currentBest.amountOut === null || JSBI.lessThan(currentBest.amountOut.quotient, amountOut.quotient)) {
            return {
              bestRoute: routes[i],
              amountIn: amountSpecified,
              amountOut,
            }
          }
        }
        else {
          const amountIn = CurrencyAmount.fromRawAmount(currencyIn, result.amountIn.toString())
          if (currentBest.amountIn === null || JSBI.greaterThan(currentBest.amountIn.quotient, amountIn.quotient)) {
            return {
              bestRoute: routes[i],
              amountIn,
              amountOut: amountSpecified,
            }
          }
        }
  
        return currentBest
      },
      {
        bestRoute: null,
        amountIn: null,
        amountOut: null,
      }
    );
  
    if (!bestRoute || !amountIn || !amountOut) {
      return {
        state: TradeState.NO_ROUTE_FOUND,
        trade: undefined,
      }
    }
  
    return {
      state: TradeState.VALID,
      trade: new InterfaceTrade({
        v2Routes: [],
        v3Routes: [
          {
            routev3: bestRoute,
            inputAmount: amountIn,
            outputAmount: amountOut,
          },
        ],
        tradeType,
      }),
    }
  }
  