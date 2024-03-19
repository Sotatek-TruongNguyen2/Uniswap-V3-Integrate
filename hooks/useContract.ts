import { Contract } from '@ethersproject/contracts'
import { AddressZero } from '@ethersproject/constants'
import { JsonRpcProvider, JsonRpcSigner } from '@ethersproject/providers'
import { getAddress } from '@ethersproject/address'
import QuoterJson from '@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json'
import { CURRENT_CHAIN_ID } from '../config'
import { QUOTER_ADDRESSES } from '../addresses'

const { abi: QuoterV2ABI } = QuoterJson

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
    try {
        return getAddress(value)
    } catch {
        return false
    }
}

// account is optional
export function getContract(address: string, ABI: any, provider: JsonRpcProvider, account?: string): Contract {
    if (!isAddress(address) || address === AddressZero) {
        throw Error(`Invalid 'address' parameter '${address}'.`)
    }

    return new Contract(address, ABI, getProviderOrSigner(provider, account) as any)
}

// account is not optional
function getSigner(provider: JsonRpcProvider, account: string): JsonRpcSigner {
    return provider.getSigner(account).connectUnchecked()
  }
  
  // account is optional
  function getProviderOrSigner(provider: JsonRpcProvider, account?: string): JsonRpcProvider | JsonRpcSigner {
    return account ? getSigner(provider, account) : provider
  }


export function useContract<T extends Contract = Contract>(
    provider: JsonRpcProvider | undefined,
    account: string | undefined,
    addressOrAddressMap: string | { [chainId: number]: string } | undefined,
    ABI: any,
    withSignerIfPossible = true
): T | null {
    const getContractInstance = (): T | null => {
        if (!addressOrAddressMap || !ABI || !provider || !CURRENT_CHAIN_ID) return null
        let address: string | undefined
        if (typeof addressOrAddressMap === 'string') address = addressOrAddressMap
        else address = addressOrAddressMap[CURRENT_CHAIN_ID]
        if (!address) return null
        try {
            return getContract(address, ABI, provider, withSignerIfPossible && account ? account : undefined) as T
        } catch (error) {
            console.error('Failed to get contract', error)
            return null
        }
    };

    return getContractInstance() as T;
}

export function useQuoter(provider: JsonRpcProvider, account: string | undefined) {
    return useContract(provider, account, QUOTER_ADDRESSES, QuoterV2ABI);
}