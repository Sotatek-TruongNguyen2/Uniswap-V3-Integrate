import { Currency, Token } from "@uniswap/sdk-core";
import { FeeAmount, Pool, Route } from "@uniswap/v3-sdk";
import { SupportedChainId } from "../chain";
import { CURRENT_CHAIN_ID } from "../config";
import { PoolState, usePools } from "./usePools";
import { useAllCurrencyCombinations } from "./useAllCurrencyCombinations";

export async function useV3SwapPools(
    currencyIn?: Currency,
    currencyOut?: Currency
): Promise<{
    pools: Pool[]
    loading: boolean
}> {
    const allCurrencyCombinations = useAllCurrencyCombinations(currencyIn, currencyOut)

    console.log("allCurrencyCombinations: ", allCurrencyCombinations)
    
    const getAllCurrencyCombinationsWithAllFees = (allCurrencyCombinations: [Token, Token][], chainId: number | undefined): [Token, Token, FeeAmount][] => {
        return allCurrencyCombinations.reduce<[Token, Token, FeeAmount][]>((list, [tokenA, tokenB]) => {
            return chainId === SupportedChainId.MAINNET
                ? list.concat([
                    [tokenA, tokenB, FeeAmount.LOW],
                    [tokenA, tokenB, FeeAmount.MEDIUM],
                    [tokenA, tokenB, FeeAmount.HIGH],
                ])
                : list.concat([
                    [tokenA, tokenB, FeeAmount.LOWEST],
                    [tokenA, tokenB, FeeAmount.LOW],
                    [tokenA, tokenB, FeeAmount.MEDIUM],
                    [tokenA, tokenB, FeeAmount.HIGH],
                ])
        }, []);
    }
    
    const allCurrencyCombinationsWithAllFees = getAllCurrencyCombinationsWithAllFees(allCurrencyCombinations, CURRENT_CHAIN_ID);

    const pools = await usePools(allCurrencyCombinationsWithAllFees)

    console.log("pools: ", pools);

    const getAllPools = (pools: [PoolState, Pool | null][]) => {
        return {
            pools: pools
                .filter((tuple): tuple is [PoolState.EXISTS, Pool] => {
                    return tuple[0] === PoolState.EXISTS && tuple[1] !== null
                })
                .map(([, pool]) => pool),
            loading: pools.some(([state]) => state === PoolState.LOADING),
        }
    }

    return getAllPools(pools);
}

