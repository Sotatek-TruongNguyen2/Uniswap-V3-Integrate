import type { FunctionFragment, Interface } from '@ethersproject/abi'

export interface Call {
    address: string
    callData: string
    gasRequired?: number
  }
  
  export interface CallStateResult extends ReadonlyArray<any> {
    readonly [key: string]: any
  }
  
  export interface CallState {
    readonly valid: boolean
    // the result, or undefined if loading or errored/no data
    readonly result: CallStateResult | undefined
    // true if the result has never been fetched
    readonly loading: boolean
    // // true if the result is not for the latest block
    // readonly syncing: boolean
    // true if the call was made and is synced, but the return data is invalid
    readonly error: boolean
  }
  
  export interface CallResult {
    readonly valid: boolean
    readonly data: string | undefined
    readonly blockNumber: number | undefined
  }
  

export const INVALID_CALL_STATE: CallState = {
    valid: false,
    result: undefined,
    loading: false,
    // syncing: false,
    error: false,
  }
  export const LOADING_CALL_STATE: CallState = {
    valid: true,
    result: undefined,
    loading: true,
    // syncing: true,
    error: false,
  }

export function toCallState(
    callResult: CallResult | undefined,
    contractInterface: Interface | undefined,
    fragment: FunctionFragment | undefined,
    latestBlockNumber: number | undefined
  ): CallState {
    if (!callResult) return INVALID_CALL_STATE
    const { valid, data } = callResult
    if (!valid) return INVALID_CALL_STATE
    if (!contractInterface || !fragment) return LOADING_CALL_STATE
    const success = data && data.length > 2
    let result: CallStateResult | undefined = undefined
    if (success && data) {
      try {
        result = contractInterface.decodeFunctionResult(fragment, data)
      } catch (error) {
        // console.debug('Result data parsing failed', fragment, data)
        return {
          valid: true,
          loading: false,
          error: true,
          result,
        }
      }
    }
    return {
      valid: true,
      loading: false,
      result,
      error: !success,
    }
  }