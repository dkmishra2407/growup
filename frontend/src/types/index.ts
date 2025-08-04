export interface User {
  id: string;
  email: string;
  name: string;
  token: string;
  Balance: number;
  HoldingId: string;
  WatchlistId: string;
  ExchangeId: string;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: string;
}

export interface WatchlistItem {
  symbol: string;
  addedAt: string;
}

export interface StockPosition {
  symbol: string;
  quantity: number;
  averagePrice: number;
}