import React, { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Wallet, TrendingUp, Star, Clock, ArrowUpRight, ArrowDownRight, DollarSign, Percent, Activity, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface Holding {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  change: number;
  changePercent: number;
}

interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

interface RecentTrade {
  symbol: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

interface PortfolioValue {
  date: string;
  value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard = () => {
  const { user } = useAuthStore();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [portfolioValue, setPortfolioValue] = useState<PortfolioValue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');
  const ws = useRef(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.HoldingId || !user?.WatchlistId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch holdings
        const holdingsResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/holding/getholding/${user.HoldingId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        // Transform holdings data
        const holdingsData = holdingsResponse.data.holdings || [];
        const holdingsWithPrices = await Promise.all(
          holdingsData.map(async (holding: any) => {
            if (!holding?.Symbol) {
              console.warn('Invalid holding data:', holding);
              return null;
            }

            try {
              const quoteResponse = await axios.get(
                `${import.meta.env.VITE_FLASK_BACKEND_URL}/api/stock-quote/${holding.Symbol}`,
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
              const quoteData = quoteResponse.data;
              const currentPrice = quoteData.intraDayHighLow?.value || quoteData.lastPrice || holding.Price;
              
              return {
                symbol: holding.Symbol,
                shares: holding.Quantity || 0,
                avgPrice: holding.Price || 0,
                currentPrice: currentPrice,
                totalValue: currentPrice * (holding.Quantity || 0),
                change: quoteData.change || 0,
                changePercent: quoteData.changePercent || 0
              };
            } catch (error) {
              console.error(`Error fetching quote for ${holding.Symbol}:`, error);
              return {
                symbol: holding.Symbol,
                shares: holding.Quantity || 0,
                avgPrice: holding.Price || 0,
                currentPrice: holding.Price || 0,
                totalValue: (holding.Price || 0) * (holding.Quantity || 0),
                change: 0,
                changePercent: 0
              };
            }
          })
        );
        // Filter out any null holdings and set the state
        setHoldings(holdingsWithPrices.filter(Boolean));

        // Fetch watchlist
        const watchlistResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/stocks/getwatchlist/${user.WatchlistId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        // Transform watchlist data
        const watchlistSymbols = watchlistResponse.data.watchlist?.Names || [];
        const watchlistWithPrices = await Promise.all(
          watchlistSymbols.map(async (symbol: string) => {
            if (!symbol) {
              console.warn('Invalid watchlist symbol');
              return null;
            }

            try {
              const quoteResponse = await axios.get(
                `${import.meta.env.VITE_FLASK_BACKEND_URL}/api/stock-quote/${symbol}`,
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
              const quoteData = quoteResponse.data;
              return {
                symbol: symbol,
                price: quoteData.intraDayHighLow?.value || quoteData.lastPrice || 0,
                change: quoteData.change || 0,
                changePercent: quoteData.changePercent || 0,
                volume: quoteData.volume || 0,
                marketCap: quoteData.marketCap || 0
              };
            } catch (error) {
              console.error(`Error fetching quote for ${symbol}:`, error);
              return null;
            }
          })
        );
        // Filter out any null watchlist items and set the state
        setWatchlist(watchlistWithPrices.filter(Boolean));

        // Fetch recent trades
        const tradesResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/stocks/history`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            params: {
              ExchangeId: user.ExchangeId
            }
          }
        );

        // Transform trades data
        const tradesData = tradesResponse.data.history || [];
        const recentTradesData = tradesData
          .filter((trade: any) => trade?.Symbol && trade?.Type && trade?.Quantity && trade?.Price)
          .slice(0, 5)
          .map((trade: any) => ({
            symbol: trade.Symbol,
            type: trade.Type.toLowerCase(),
            shares: trade.Quantity,
            price: trade.Price,
            date: new Date(trade.Date).toLocaleDateString(),
            status: trade.Status || 'completed'
          }));
        setRecentTrades(recentTradesData);

        // Calculate portfolio value history
        const validHoldings = holdingsWithPrices.filter(Boolean);
        const portfolioHistory = validHoldings.map((holding, index) => ({
          date: new Date(Date.now() - (validHoldings.length - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: validHoldings.slice(0, index + 1).reduce((sum, h) => sum + (h?.totalValue || 0), 0)
        }));
        setPortfolioValue(portfolioHistory);

        // Connect to WebSocket for watchlist updates
        ws.current = new WebSocket(`${import.meta.env.VITE_FLASK_BACKEND_URL.replace('http', 'ws')}/ws`);

        ws.current.onopen = () => {
          // Subscribe to all watchlist symbols
          watchlistSymbols.forEach(symbol => {
            ws.current.send(JSON.stringify({ action: "subscribe", symbol }));
          });
        };

        ws.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.T === "q") {
            setWatchlist(prevWatchlist => 
              prevWatchlist.map(item => 
                item.symbol === data.S 
                  ? { 
                      ...item, 
                      price: data.lastPrice,
                      change: data.change,
                      changePercent: data.pChange
                    }
                  : item
              )
            );
          }
        };

        ws.current.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        ws.current.onclose = () => {
          console.log("WebSocket connection closed");
        };

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Cleanup WebSocket connection
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user]);

  const totalPortfolioValue = holdings?.reduce((sum, holding) => sum + (holding?.totalValue || 0), 0) || 0;
  const todayGainLoss = holdings?.reduce((sum, holding) => sum + ((holding?.change || 0) * (holding?.shares || 0)), 0) || 0;
  const gainLossPercentage = totalPortfolioValue > 0 ? (todayGainLoss / totalPortfolioValue) * 100 : 0;

  const topPerformer = holdings?.length > 0 
    ? holdings.reduce((prev, current) => 
        (current?.changePercent || 0) > (prev?.changePercent || 0) ? current : prev
      )
    : null;

  const sectorDistribution = [
    { name: 'Technology', value: 35 },
    { name: 'Finance', value: 25 },
    { name: 'Healthcare', value: 15 },
    { name: 'Consumer', value: 15 },
    { name: 'Other', value: 10 }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Wallet className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold ml-3">Portfolio Value</h3>
            </div>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold">${totalPortfolioValue.toLocaleString()}</p>
          <div className="flex items-center mt-2">
            <span className={`text-sm ${gainLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {gainLossPercentage >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%
            </span>
            <span className="text-gray-500 text-sm ml-2">Today</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold ml-3">Today's Gain/Loss</h3>
            </div>
            <Percent className="h-5 w-5 text-gray-400" />
          </div>
          <p className={`text-3xl font-bold ${todayGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(todayGainLoss).toLocaleString()}
          </p>
          <div className="flex items-center mt-2">
            {todayGainLoss >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
            <span className="text-gray-500 text-sm ml-1">vs yesterday</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Star className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold ml-3">Top Performer</h3>
            </div>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          {topPerformer ? (
            <>
              <p className="text-2xl font-bold">{topPerformer.symbol}</p>
              <div className="flex items-center mt-2">
                <span className={`text-sm ${topPerformer.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {topPerformer.changePercent >= 0 ? '+' : ''}{topPerformer.changePercent.toFixed(2)}%
                </span>
                <span className="text-gray-500 text-sm ml-2">Today</span>
              </div>
            </>
          ) : (
            <p className="text-gray-500">No holdings</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold ml-3">Market Status</h3>
            </div>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-green-600">Open</p>
          <p className="text-gray-500 text-sm mt-2">Market closes in 2h 15m</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Portfolio Performance */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Portfolio Performance</h2>
            <div className="flex space-x-2">
              {['1W', '1M', '3M', '1Y', 'ALL'].map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    selectedTimeframe === timeframe
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioValue}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold mb-6">Sector Distribution</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sectorDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {sectorDistribution.map((sector, index) => (
              <div key={sector.name} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-600">{sector.name}</span>
                <span className="text-sm font-medium ml-auto">{sector.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Holdings */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold">Current Holdings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {holdings.map((holding) => (
                  <tr key={holding.symbol} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{holding.symbol}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {holding.shares}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      ${holding.avgPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      ${holding.currentPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      ${holding.totalValue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className={`${holding.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {holding.changePercent >= 0 ? '+' : ''}{holding.changePercent.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-8">
          {/* Watchlist */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">Watchlist</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {watchlist.map((stock) => (
                <div key={stock.symbol} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{stock.symbol}</h3>
                      <p className="text-sm text-gray-500">${stock.price.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </p>
                      <p className="text-sm text-gray-500">
                        Vol: {(stock.volume / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Trades */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-bold">Recent Trades</h2>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {recentTrades.map((trade, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{trade.symbol}</h3>
                      <p className="text-sm text-gray-500">{trade.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${trade.type === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.type.toUpperCase()} {trade.shares} shares
                      </p>
                      <p className="text-sm text-gray-500">
                        @ ${trade.price.toFixed(2)}
                      </p>
                      <span className={`text-xs ${
                        trade.status === 'completed' ? 'text-green-600' :
                        trade.status === 'pending' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {trade.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;