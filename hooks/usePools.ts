import { V3_CORE_FACTORY_ADDRESSES } from "../addresses";
import { Currency, Token, BigintIsh } from "@uniswap/sdk-core";
import JSBI from "jsbi";
import { Pool, FeeAmount, computePoolAddress } from "@uniswap/v3-sdk";
import { CURRENT_CHAIN_ID, MULTICALL_ADDRESS } from "../config";
import MulticallABI from "../abi/multicall.json";
import { Interface } from "@ethersproject/abi";
import { abi as IUniswapV3PoolStateABI } from "@uniswap/v3-core/artifacts/contracts/interfaces/pool/IUniswapV3PoolState.sol/IUniswapV3PoolState.json";
import { ethers } from "ethers";

const POOL_STATE_INTERFACE = new Interface(IUniswapV3PoolStateABI);

class PoolCache {
  // Evict after 128 entries. Empirically, a swap uses 64 entries.
  private static MAX_ENTRIES = 128;

  // These are FIFOs, using unshift/pop. This makes recent entries faster to find.
  private static pools: Pool[] = [];
  private static addresses: { key: string; address: string }[] = [];

  static getPoolAddress(
    factoryAddress: string,
    tokenA: Token,
    tokenB: Token,
    fee: FeeAmount
  ): string {
    if (this.addresses.length > this.MAX_ENTRIES) {
      this.addresses = this.addresses.slice(0, this.MAX_ENTRIES / 2);
    }

    const { address: addressA } = tokenA;
    const { address: addressB } = tokenB;
    const key = `${factoryAddress}:${addressA}:${addressB}:${fee.toString()}`;
    const found = this.addresses.find((address) => address.key === key);
    if (found) return found.address;

    const address = {
      key,
      address: computePoolAddress({
        factoryAddress,
        tokenA,
        tokenB,
        fee,
      }),
    };
    this.addresses.unshift(address);
    return address.address;
  }

  static getPool(
    tokenA: Token,
    tokenB: Token,
    fee: FeeAmount,
    sqrtPriceX96: BigintIsh,
    liquidity: BigintIsh,
    tick: number
  ): Pool {
    if (this.pools.length > this.MAX_ENTRIES) {
      this.pools = this.pools.slice(0, this.MAX_ENTRIES / 2);
    }

    const found = this.pools.find(
      (pool) =>
        pool.token0 === tokenA &&
        pool.token1 === tokenB &&
        pool.fee === fee &&
        JSBI.EQ(pool.sqrtRatioX96, sqrtPriceX96) &&
        JSBI.EQ(pool.liquidity, liquidity) &&
        pool.tickCurrent === tick
    );
    if (found) return found;

    const pool = new Pool(tokenA, tokenB, fee, sqrtPriceX96, liquidity, tick);
    this.pools.unshift(pool);
    return pool;
  }
}

export enum PoolState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export async function usePools(
  poolKeys: [
    Currency | undefined,
    Currency | undefined,
    FeeAmount | undefined
  ][]
) {
  const getPoolTokens = (
    chainId: number,
    poolKeys: [
      Currency | undefined,
      Currency | undefined,
      FeeAmount | undefined
    ][]
  ): ([Token, Token, FeeAmount] | undefined)[] => {
    if (!CURRENT_CHAIN_ID) return new Array(poolKeys.length);

    return poolKeys.map(([currencyA, currencyB, feeAmount]) => {
      if (currencyA && currencyB && feeAmount) {
        const tokenA = currencyA.wrapped;
        const tokenB = currencyB.wrapped;
        if (tokenA.equals(tokenB)) return undefined;

        return tokenA.sortsBefore(tokenB)
          ? [tokenA, tokenB, feeAmount]
          : [tokenB, tokenA, feeAmount];
      }
      return undefined;
    });
  };

  const poolTokens = getPoolTokens(CURRENT_CHAIN_ID, poolKeys);

  const getPoolAddresses = (
    chainId: number,
    poolTokens: ([Token, Token, FeeAmount] | undefined)[]
  ): (string | undefined)[] => {
    const v3CoreFactoryAddress = chainId && V3_CORE_FACTORY_ADDRESSES[chainId];
    if (!v3CoreFactoryAddress) return new Array(poolTokens.length);

    return poolTokens.map(
      (value) =>
        value && PoolCache.getPoolAddress(v3CoreFactoryAddress, ...value)
    );
  };

  const poolAddresses = getPoolAddresses(CURRENT_CHAIN_ID, poolTokens);
  const web3Provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/fc9e3df5e54f41968f36d42f4068c255')
  const multiCall = new ethers.Contract(MULTICALL_ADDRESS, MulticallABI, web3Provider);

  console.log("poolAddresses: ", poolAddresses);

  const callDatas = poolAddresses.map((poolAddress) => ({
    target: poolAddress,
    callData: POOL_STATE_INTERFACE.encodeFunctionData("slot0"),
  }));

  console.log("callDatas: A", callDatas);

  const liquidityCallDatas = poolAddresses.map((poolAddress) => ({
    target: poolAddress,
    callData: POOL_STATE_INTERFACE.encodeFunctionData("liquidity"),
  }));

  const multiResults = await multiCall.aggregate(callDatas);

  const decodedResults = multiResults.returnData.map((result: any) => {
    return {
      result: result == "0x" ? undefined : POOL_STATE_INTERFACE.decodeFunctionResult("slot0", result),
      valid: result != "0x"
    }
  });

  const liquidityMultiResults = await multiCall.aggregate(liquidityCallDatas);
  const liquidityDecodedResults = liquidityMultiResults.returnData.map(
    (result: any) => {
      return {
        result:
          result == "0x"
            ? undefined
            : POOL_STATE_INTERFACE.decodeFunctionResult("liquidity", result),
        valid: result != "0x",
      };
    }
  );

  // console.log(liquidityDecodedResults);
  // console.log(decodedResults);

  const getAllPools = (
    liquidities: any,
    slot0s: any,
    poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][],
    poolTokens: ([Token, Token, FeeAmount] | undefined)[]
  ): [PoolState, Pool | null][] => {
    return poolKeys.map((_key, index) => {
      const tokens = poolTokens[index]
      if (!tokens) return [PoolState.INVALID, null]
      const [token0, token1, fee] = tokens
      if (!slot0s[index]) return [PoolState.INVALID, null]
      const { result: slot0, valid: slot0Valid } = slot0s[index]

      if (!liquidities[index]) return [PoolState.INVALID, null]
      const { result: liquidity, valid: liquidityValid } = liquidities[index]
      if (!tokens || !slot0Valid || !liquidityValid) return [PoolState.INVALID, null]
      if (!slot0 || !liquidity) return [PoolState.NOT_EXISTS, null]
      if (!slot0.sqrtPriceX96 || slot0.sqrtPriceX96.eq(0)) return [PoolState.NOT_EXISTS, null]

      try {
        const pool = PoolCache.getPool(token0, token1, fee, slot0.sqrtPriceX96, liquidity[0], slot0.tick)
        return [PoolState.EXISTS, pool]
      } catch (error) {
        console.error('Error when constructing the pool', error)
        return [PoolState.NOT_EXISTS, null]
      }
    })
  }


  return getAllPools(liquidityDecodedResults, decodedResults, poolKeys, poolTokens);
}

// export function usePool(
//     currencyA: Currency | undefined,
//     currencyB: Currency | undefined,
//     feeAmount: FeeAmount | undefined
// ): [PoolState, Pool | null] {
//     const poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][] = [[currencyA, currencyB, feeAmount]];
//     return usePools(poolKeys)[0]
// }
