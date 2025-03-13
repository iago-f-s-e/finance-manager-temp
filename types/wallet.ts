export interface Wallet {
  id: string
  name: string
  description?: string
  balance: number
  color?: string
  icon?: string
  isDefault?: boolean
  createdAt: Date
}

export interface WalletTransfer {
  id: string
  fromWalletId: string
  toWalletId: string
  amount: number
  description?: string
  date: Date
  createdAt: Date
}

