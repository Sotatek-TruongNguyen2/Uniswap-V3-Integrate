// adapted from https://github.com/Uniswap/interface/src/constants/tokens.ts
import { Currency, NativeCurrency as NativeCurrencyClass, Token } from '@uniswap/sdk-core'
import { BigNumberish } from 'ethers'
// import { getNativeAddress } from 'wallet/src/constants/addresses'
// import { CHAIN_INFO, ChainId } from 'wallet/src/constants/chains'
// import { wrappedNativeCurrency } from 'wallet/src/constants/tokens'
// import { toSupportedChainId } from 'wallet/src/features/chains/utils'

/** Address that represents native currencies on ETH, Arbitrum, etc. */
export const DEFAULT_NATIVE_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'


export function wrappedNativeCurrency(chainId: ChainId): Token {
    //@ts-ignore
    const wrappedCurrencyInfo = CHAIN_INFO[chainId].wrappedNativeCurrency
    return new Token(
      chainId,
      wrappedCurrencyInfo.address,
      wrappedCurrencyInfo.decimals,
      wrappedCurrencyInfo.symbol,
      wrappedCurrencyInfo.name
    )
  }


// Renamed from SupportedChainId in web app
export enum ChainId {
    Mainnet = 1,
    Goerli = 5,
  
    ArbitrumOne = 42161,
    Base = 8453,
    Optimism = 10,
    Polygon = 137,
    PolygonMumbai = 80001,
    Bnb = 56,
    Sepolia = 11155111
}

export const TESTNET_CHAIN_IDS = [ChainId.Sepolia, ChainId.Goerli, ChainId.PolygonMumbai]

export const ETHEREUM_CHAIN_IDS = [ChainId.Mainnet, ChainId.Goerli, ChainId.Sepolia] as const

// Renamed from SupportedL1ChainId in web app
export type EthereumChainId = (typeof ETHEREUM_CHAIN_IDS)[number]

export const L2_CHAIN_IDS = [
    ChainId.ArbitrumOne,
    ChainId.Base,
    ChainId.Optimism,
    ChainId.Polygon,
    ChainId.PolygonMumbai,
    ChainId.Bnb,
  ] as const
  
  // Renamed from SupportedL2ChainId in web app
export type L2ChainId = (typeof L2_CHAIN_IDS)[number]

export interface L1ChainInfo {
    readonly blockWaitMsBeforeWarning?: number
    readonly bridge?: string
    readonly docs: string
    readonly explorer: {
      name: string
      url: string
    }
    readonly infoLink: string
    readonly label: string
    readonly logoUrl?: string
    readonly rpcUrls?: Partial<{ [key in keyof RPCType as RPCType]: string }>
    readonly nativeCurrency: {
      name: string // 'Goerli ETH',
      symbol: string // 'gorETH',
      decimals: number // 18,
      address: string // '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      explorerLink?: string // Special override for native ETH explorer link
    }
    readonly wrappedNativeCurrency: {
      name: string // 'Wrapped Ether',
      symbol: string // 'WETH',
      decimals: number // 18,
      address: string // '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6'
    }
  }

export interface L2ChainInfo extends L1ChainInfo {
  readonly bridge: string
  readonly statusPage?: string
}

export type ChainInfo = {
    readonly [chainId in L2ChainId]: L2ChainInfo
  } & { readonly [chainId in EthereumChainId]: L1ChainInfo }

export enum RPCType {
    Public = 'public',
    Private = 'private',
    PublicAlt = 'public_alternative',
  }

export const CHAIN_INFO = {
    [ChainId.ArbitrumOne]: {
      blockWaitMsBeforeWarning: 600000, // 10 minutes
      bridge: 'https://bridge.arbitrum.io/',
      docs: 'https://offchainlabs.com/',
      explorer: {
        name: 'Arbiscan',
        url: 'https://arbiscan.io/',
      },
      infoLink: 'https://info.uniswap.org/#/arbitrum',
      label: 'Arbitrum',
      nativeCurrency: {
        name: 'Arbitrum ETH',
        symbol: 'ETH',
        decimals: 18,
        address: DEFAULT_NATIVE_ADDRESS,
        explorerLink: 'https://arbiscan.io/chart/etherprice',
      },
      wrappedNativeCurrency: {
        name: 'Wrapped Ether',
        symbol: 'WETH',
        decimals: 18,
        address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
      },
      rpcUrls: { [RPCType.PublicAlt]: 'https://arb1.arbitrum.io/rpc' },
    },
    [ChainId.Mainnet]: {
      blockWaitMsBeforeWarning: 60000, // 1 minute
      docs: 'https://docs.uniswap.org/',
      explorer: {
        name: 'Etherscan',
        url: 'https://etherscan.io/',
      },
      infoLink: 'https://info.uniswap.org/#/',
      label: 'Ethereum',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        address: DEFAULT_NATIVE_ADDRESS,
        explorerLink: 'https://etherscan.io/chart/etherprice',
      },
      wrappedNativeCurrency: {
        name: 'Wrapped Ether',
        symbol: 'WETH',
        decimals: 18,
        address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      },
      rpcUrls: { [RPCType.Private]: 'https://rpc.mevblocker.io/?referrer=uniswapwallet' },
    },
    [ChainId.Goerli]: {
      blockWaitMsBeforeWarning: 180000, // 3 minutes
      docs: 'https://docs.uniswap.org/',
      explorer: {
        name: 'Etherscan',
        url: 'https://goerli.etherscan.io/',
      },
      infoLink: 'https://info.uniswap.org/#/',
      label: 'Görli',
      nativeCurrency: {
        name: 'Görli ETH',
        symbol: 'görETH',
        decimals: 18,
        address: DEFAULT_NATIVE_ADDRESS,
        explorerLink: 'https://etherscan.io/chart/etherprice', // goerli.etherscan.io doesn't work
      },
      wrappedNativeCurrency: {
        name: 'Wrapped Ether',
        symbol: 'WETH',
        decimals: 18,
        address: '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6',
      },
    },
    [ChainId.Sepolia]: {
        blockWaitMsBeforeWarning: 180000, // 3 minutes
        docs: 'https://docs.uniswap.org/',
        explorer: {
          name: 'Etherscan',
          url: 'https://goerli.etherscan.io/',
        },
        infoLink: 'https://info.uniswap.org/#/',
        label: 'Sepolia',
        nativeCurrency: {
          name: 'Sepolia ETH',
          symbol: 'Sepolia',
          decimals: 18,
          address: DEFAULT_NATIVE_ADDRESS,
          explorerLink: 'https://etherscan.io/chart/etherprice', // goerli.etherscan.io doesn't work
        },
        wrappedNativeCurrency: {
          name: 'Wrapped Ether',
          symbol: 'WETH',
          decimals: 18,
          address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
        },
      },
    [ChainId.Base]: {
      blockWaitMsBeforeWarning: 600000,
      bridge: 'https://bridge.base.org/',
      docs: 'https://base.org/',
      explorer: {
        name: 'BaseScan',
        url: 'https://basescan.org/',
      },
      infoLink: 'https://info.uniswap.org/#/base',
      label: 'Base',
      nativeCurrency: {
        name: 'Base ETH',
        symbol: 'ETH',
        decimals: 18,
        address: DEFAULT_NATIVE_ADDRESS,
        explorerLink: 'https://basescan.org/chart/etherprice',
      },
      wrappedNativeCurrency: {
        name: 'Wrapped Ether',
        symbol: 'WETH',
        decimals: 18,
        address: '0x4200000000000000000000000000000000000006',
      },
      rpcUrls: { [RPCType.Public]: 'https://mainnet.base.org' },
    },
    [ChainId.Bnb]: {
      blockWaitMsBeforeWarning: 600000,
      bridge: 'https://www.bnbchain.org/bridge',
      docs: 'https://www.bnbchain.org/',
      explorer: {
        name: 'BscScan',
        url: 'https://bscscan.com/',
      },
      infoLink: 'https://info.uniswap.org/#/bnb',
      label: 'BNB',
      nativeCurrency: {
        name: 'Binance Coin',
        symbol: 'BNB',
        decimals: 18,
        address: '0xb8c77482e45f1f44de1745f52c74426c631bdd52',
      },
    },
    [ChainId.Optimism]: {
      blockWaitMsBeforeWarning: 1200000, // 20 minutes
      bridge: 'https://gateway.optimism.io/',
      docs: 'https://optimism.io/',
      explorer: {
        name: 'OP Etherscan',
        url: 'https://optimistic.etherscan.io/',
      },
      infoLink: 'https://info.uniswap.org/#/optimism',
      label: 'Optimism',
      nativeCurrency: {
        name: 'Optimistic ETH',
        symbol: 'ETH',
        decimals: 18,
        address: DEFAULT_NATIVE_ADDRESS,
        explorerLink: 'https://optimistic.etherscan.io/chart/etherprice',
      },
      wrappedNativeCurrency: {
        name: 'Wrapped Ether',
        symbol: 'WETH',
        decimals: 18,
        address: '0x4200000000000000000000000000000000000006',
      },
      rpcUrls: { [RPCType.PublicAlt]: 'https://mainnet.optimism.io' },
      statusPage: 'https://optimism.io/status',
    },
    [ChainId.Polygon]: {
      blockWaitMsBeforeWarning: 600000, // 10 minutes
      bridge: 'https://wallet.polygon.technology/bridge',
      docs: 'https://polygon.io/',
      explorer: {
        name: 'PolygonScan',
        url: 'https://polygonscan.com/',
      },
      infoLink: 'https://info.uniswap.org/#/polygon/',
      label: 'Polygon',
      nativeCurrency: {
        name: 'Polygon Matic',
        symbol: 'MATIC',
        decimals: 18,
        address: '0x0000000000000000000000000000000000001010',
      },
      wrappedNativeCurrency: {
        name: 'Wrapped MATIC',
        symbol: 'WMATIC',
        decimals: 18,
        address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      },
      rpcUrls: { [RPCType.PublicAlt]: 'https://polygon-rpc.com/' },
    },
    [ChainId.PolygonMumbai]: {
      blockWaitMsBeforeWarning: 600000, // 10 minutes
      bridge: 'https://wallet.polygon.technology/bridge',
      docs: 'https://polygon.io/',
      explorer: {
        name: 'PolygonScan',
        url: 'https://mumbai.polygonscan.com/',
      },
      infoLink: 'https://info.uniswap.org/#/polygon/',
      label: 'Polygon Mumbai',
      nativeCurrency: {
        name: 'Polygon Mumbai Matic',
        symbol: 'mMATIC',
        decimals: 18,
        address: '0x0000000000000000000000000000000000001010',
      },
      wrappedNativeCurrency: {
        name: 'Wrapped MATIC',
        symbol: 'WMATIC',
        decimals: 18,
        address: '0x9c3c9283d3e44854697cd22d3faa240cfb032889',
      },
      rpcUrls: { [RPCType.PublicAlt]: 'https://rpc-endpoints.superfluid.dev/mumbai' },
    },
  }

export function getNativeAddress(chainId: ChainId): string {
    return CHAIN_INFO[chainId].nativeCurrency.address
}
  
  export const ALL_SUPPORTED_CHAINS: string[] = Object.values(ChainId).map((c) => c.toString())

// Some code from the web app uses chainId types as numbers
// This validates them as coerces into SupportedChainId
export function toSupportedChainId(chainId?: BigNumberish): ChainId | null {
    if (!chainId || !ALL_SUPPORTED_CHAINS.includes(chainId.toString())) {
      return null
    }
    return parseInt(chainId.toString(), 10) as ChainId
  }
  

export class NativeCurrency implements NativeCurrencyClass {
  constructor(chainId: number) {
    console.log("HERE");
    const supportedChainId = toSupportedChainId(chainId)
    if (!supportedChainId) {
      throw new Error(`Unsupported chain ID: ${chainId}`)
    }

    const chainInfo = CHAIN_INFO[supportedChainId]
    if (!chainInfo) {
      throw new Error('Native currrency info not found')
    }

    this.chainId = supportedChainId
    this.decimals = chainInfo.nativeCurrency.decimals
    this.name = chainInfo.nativeCurrency.name
    this.symbol = chainInfo.nativeCurrency.symbol
    this.isNative = true
    this.isToken = false
    this.address = getNativeAddress(this.chainId)
  }

  chainId: ChainId
  decimals: number
  name: string
  symbol: string
  isNative: true
  isToken: false
  address: string

  equals(currency: Currency): boolean {
    return currency.isNative && currency.chainId === this.chainId
  }

  public get wrapped(): Token {
    return wrappedNativeCurrency(this.chainId)
  }

  private static _cachedNativeCurrency: { [chainId: number]: NativeCurrency } = {}

  public static onChain(chainId: number): NativeCurrency {
    return (
      this._cachedNativeCurrency[chainId] ??
      (this._cachedNativeCurrency[chainId] = new NativeCurrency(chainId))
    )
  }
}
