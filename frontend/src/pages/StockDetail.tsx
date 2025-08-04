import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

interface StockData {
  lastPrice: number;
  previousClose: number;
  change: number;
  pChange: number;
  open: number;
  intraDayHighLow: {
    max: number;
    min: number;
  };
  weekHighLow: {
    max: number;
    min: number;
    maxDate: string;
    minDate: string;
  };
  vwap: number;
  close: number;
  lowerCP: string;
  upperCP: string;
  pPriceBand: string;
  basePrice: number;
  ieq: string;
  iNavValue: number;
  tickSize: number;
  stockIndClosePrice: number;
  checkINAV: boolean;
  marketStatus: string;
  advances: number;
  declines: number;
  unchanged: number;
  indexSymbol: string;
  symbol: string;
}

interface OrderStatus {
  success: boolean;
  message: string;
  details?: any;
}

const StockDetails = () => {
  const { symbol: paramSymbol } = useParams();
  const [symbol, setSymbol] = useState('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('1d');
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState('MARKET'); // MARKET or LIMIT
  const [limitPrice, setLimitPrice] = useState('');
  const [isBuying, setIsBuying] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [userBalance, setUserBalance] = useState(user?.Balance || 0);
  const ws = useRef<WebSocket | null>(null);

  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    if (paramSymbol) {
      setSymbol(paramSymbol);
    }
  }, [paramSymbol]);

  // Set limit price from live data
  useEffect(() => {
    if (stockData?.lastPrice) {
      setLimitPrice(stockData.lastPrice.toFixed(2));
    }
  }, [stockData?.lastPrice]);

  // WebSocket and data fetch logic
  useEffect(() => {
    if (!symbol) return;

    const fetchInitialData = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          `${import.meta.env.VITE_FLASK_BACKEND_URL}/api/stock-quote/${symbol}`)
        if (!response.data) {
          throw new Error("No data received from API");
        }
        setStockData(response.data);
        setLoading(false);

        // Connect to WebSocket
        ws.current = new WebSocket(`${import.meta.env.VITE_FLASK_BACKEND_URL.replace('http', 'ws')}/ws`);

        ws.current.onopen = () => {
          setStatus("Connected");
          ws.current.send(JSON.stringify({ action: "subscribe", symbol }));
        };

        ws.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.T === "q" && data.S === symbol) {
            console.log("data from websocket", data);
            setStockData(data);
            setLoading(false);
          }
        };

        ws.current.onerror = () => setStatus("Connection error");
        ws.current.onclose = () => setStatus("Disconnected");
        
        // Fetch graph data
        try {
          const response = await fetch(
            `${import.meta.env.VITE_FLASK_BACKEND_URL}/api/graph-data/${symbol}`
          );
          if (!response.ok) {
            throw new Error(`Graph fetch failed: ${response.statusText}`);
          }
          const data = await response.json();
          setGraphData(data || []);
        } catch (graphErr) {
          console.error("Error fetching graph data:", graphErr);
          setError(`Graph data error: ${graphErr.message}`);
        }
      } catch (err) {
        console.error("Error initializing:", err);
        setError(`Initialization error: ${err.message}`);
        setLoading(false);
      }
    };

    fetchInitialData();

    // Cleanup function
    return () => {
      if (ws.current) {
        if (ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ action: "unsubscribe", symbol }));
        }
        ws.current.close();
      }
    };
  }, [symbol]);


  const formatGraphData = (data) => {
    if (!data || data.length === 0) return [];
    
    return data.map(point => ({
      timestamp: point[0],
      price: point[1],
      date: new Date(point[0]).toLocaleTimeString()
    }));
  };

  const getTimeframeData = () => {
    if (!graphData || graphData.length === 0) return [];
    
    const formattedData = formatGraphData(graphData);
    
    if (timeframe === '1d') {
      return formattedData.slice(0, 100);
    } else if (timeframe === '30d') {
      return formattedData;
    } else {
      return formattedData;
    }
  };
  
  const watchlist = user.WatchlistId    || [];
  const handleAddToWatchlist = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/stocks/addwatchlist`, {
        WatchlistId: watchlist,
        stockName: symbol
      });
      console.log('Added to watchlist:', response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.msg || err.message;
        toast.error(msg);
      } else {
        toast.error('Failed to add to watchlist');
      }
      console.error('Failed to add to watchlist:', err);
    }
  };

  const handleBuy = async (order_t) => {
    if (!quantity || quantity <= 0) {
      setOrderStatus({ success: false, message: 'Please enter a valid quantity' });
      return;
    }
  
    if (orderType === 'LIMIT' && (!limitPrice || isNaN(limitPrice) || limitPrice <= 0)) {
      setOrderStatus({ success: false, message: 'Please enter a valid limit price' });
      return;
    }
  
    try {
      setIsBuying(true);
      setOrderStatus(null);
  
      // Get user info from local storage
      if (!user) {
        throw new Error('User not authenticated');
      }
  
      // Prepare order data according to backend expectations
      const orderData = {
        symbol: symbol.toUpperCase(),
        quantity: parseInt(quantity),
        order_type: order_t,
        target_price:parseFloat(stockData?.lastPrice),
        Email: user.Email,
        OrderId: user.ExchangeId,
        HoldingId: user.HoldingId
      };

      // Use environment variable for the backend URL
      const backendUrl = import.meta.env.VITE_FLASK_BACKEND_URL || 'http://localhost:8000';
  
      const response = await axios.post(
        `${backendUrl}/api/place-order`,
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );
  
      setOrderStatus({ 
        success: true, 
        message: `${order_t} order placed successfully!`,
        details: response.data
      });
  
      // Update local user balance if needed
      if (response.data.order) {
        const updatedUser = { ...user };
        if (response.data.order.order_type === 'BUY') {
          const cost = response.data.order.quantity * response.data.order.target_price;
          updatedUser.Balance = (updatedUser.Balance || 0) - cost;
        }
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
  
      console.log('Buy order response:', response.data);
    } catch (err) {
      console.error('Error placing buy order:', err);
      let errorMessage = 'Failed to place buy order';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.response) {
        errorMessage = err.response.data?.error || err.response.data?.message || err.message;
      } else {
        errorMessage = err.message || 'An unknown error occurred';
      }
      
      setOrderStatus({ 
        success: false, 
        message: errorMessage
      });
    } finally {
      setIsBuying(false);
    }
  };

  const handleSell = async () => {
    if (!quantity || quantity <= 0) {
      setOrderStatus({ success: false, message: 'Please enter a valid quantity' });
      return;
    }
  
    if (orderType === 'LIMIT' && (!limitPrice || isNaN(limitPrice))) {
      setOrderStatus({ success: false, message: 'Please enter a valid limit price' });
      return;
    }
  
    try {
      setIsSelling(true);
      setOrderStatus(null);
  
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) throw new Error('User not authenticated');
  
      // 1. First fetch current holdings
      const holdingsResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/holding/getholding/${user.HoldingId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
  
      // 2. Check if the response contains holdings
      if (!holdingsResponse.data.holdings) {
        throw new Error('No holdings data received');
      }
  
      // 3. Find the specific stock in holdings
      const stockHolding = holdingsResponse.data.holdings.find(
        h => h.Symbol === symbol
      );
  
      // 4. Verify ownership and quantity
      if (!stockHolding) {
        throw new Error(`You don't own ${symbol}`);
      }
  
      if (stockHolding.Quantity < quantity) {
        throw new Error(`Only ${stockHolding.Quantity} shares available to sell`);
      }
  
      // 5. Proceed with sell order
      const orderData = {
        UserId: user._id,
        Type: 'SELL',
        Price: orderType === 'LIMIT' ? parseFloat(limitPrice) : stockData.lastPrice,
        Qty: parseInt(quantity),
        Name: stockData.name || symbol,
        Symbol: symbol,
        Time: new Date().toISOString(),
        ExchangeId: `EXCH-${user._id}-${Date.now()}`,
        HoldingId: user.HoldingId
      };
  
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/exchange/sell`,
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
  
      setOrderStatus({ 
        success: true, 
        message: 'Sold successfully!',
        details: response.data
      });
  
      // Refresh holdings after successful sale
      fetchUserHoldings();
      
    } catch (err) {
      console.error('Sell error:', err);
      setOrderStatus({
        success: false,
        message: err.response?.data?.message || err.message || 'Sell failed'
      });
    } finally {
      setIsSelling(false);
    }
  };

  // Define fetchUserHoldings function
  const fetchUserHoldings = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) throw new Error('User not authenticated');
  
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/holding/getholding/${user.HoldingId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
  
      console.log('User holdings:', response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching user holdings:', err);
      throw err;
    }
  };

  if (loading) return <div className="p-4 text-center">Loading stock data...</div>;
  if (error) return <div className="p-4 text-center text-red-600">Error: {error}</div>;
  if (!stockData) return <div className="p-4 text-center">No stock data available</div>;

  const priceInfo = stockData;
  const chartData = getTimeframeData();

  const lastPrice = stockData.lastPrice || 0;
  const previousClose = stockData.previousClose || 0;
  const priceChange = stockData.change || 0;
  const priceChangePercent = stockData.pChange || 0;
  const isPriceUp = priceChange >= 0;
  const open = stockData.open || 0;
  const high = stockData.intraDayHighLow?.max || 0;
  const low = stockData.intraDayHighLow?.min || 0;
  const yearLow = stockData.weekHighLow?.min || 0;
  const yearHigh = stockData.weekHighLow?.max || 0;
  const yearLowDate = stockData.weekHighLow?.minDate || "";
  const yearHighDate = stockData.weekHighLow?.maxDate || "";

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white shadow-lg rounded-lg">
      {/* Header with current price and change */}
      <div className="mb-6">
        <div className="flex justify-between items-baseline">
          <h1 className="text-2xl font-bold">{symbol}</h1>
          <p className="text-gray-500 text-sm">{stockData.indexSymbol || stockData.symbol}</p>
        </div>
        
        <div className="flex items-baseline mt-2">
          <span className="text-3xl font-bold mr-3">₹{lastPrice.toFixed(2)}</span>
          <span className={`text-lg ${isPriceUp ? 'text-green-600' : 'text-red-600'}`}>
            {isPriceUp ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
          </span>
        </div>
      </div>
      
      {/* Order form */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Trade</h2>
        
        {orderStatus && (
          <div className={`mb-3 p-2 rounded ${orderStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {orderStatus.message}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
            <select
              className="w-full p-2 border rounded"
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
            >
              <option value="MARKET">Market</option>
              <option value="LIMIT">Limit</option>
            </select>
          </div>
          
          {orderType === 'LIMIT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limit Price (₹)</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
            />
          </div>
          
          <div className="flex items-end space-x-2">
            <button
              onClick={() => handleBuy('BUY')}
              disabled={isBuying || isSelling}
              className={`px-4 py-2 rounded text-white ${isBuying ? 'bg-blue-400' : 'bg-green-600 hover:bg-green-700'} flex-1`}
            >
              {isBuying ? 'Buying...' : 'Buy'}
            </button>
            <button
              onClick={() => handleBuy('SELL')}
              disabled={isBuying || isSelling}
              className={`px-4 py-2 rounded text-white ${isSelling ? 'bg-blue-400' : 'bg-red-600 hover:bg-red-700'} flex-1`}
            >
              {isSelling ? 'Selling...' : 'Sell'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Chart section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Price Chart</h2>
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1 rounded ${timeframe === '1d' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              onClick={() => handleAddToWatchlist()}
            >
              Add To Watchlist
            </button>
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={Math.floor(chartData.length / 5)}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value) => [`₹${value}`, 'Price']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={false} 
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Stock details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">Today's Trading</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-gray-500 text-sm">Open</p>
              <p className="font-medium">₹{open.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Previous Close</p>
              <p className="font-medium">₹{previousClose.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">High</p>
              <p className="font-medium">₹{high.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Low</p>
              <p className="font-medium">₹{low.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">VWAP</p>
              <p className="font-medium">₹{(priceInfo.vwap || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Close</p>
              <p className="font-medium">₹{(priceInfo.close || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">52 Week Range</h2>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <p className="text-gray-500 text-sm">52W Low</p>
              <p className="font-medium">₹{yearLow.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{yearLowDate}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">52W High</p>
              <p className="font-medium">₹{yearHigh.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{yearHighDate}</p>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span>₹{yearLow.toFixed(2)}</span>
              <span>₹{yearHigh.toFixed(2)}</span>
            </div>
            <div className="relative h-2 bg-gray-200 rounded overflow-hidden">
              <div 
                className="absolute h-full bg-blue-600"
                style={{ 
                  width: `${((lastPrice - yearLow) / (yearHigh - yearLow)) * 100}%`
                }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">Price Bands</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-gray-500 text-sm">Lower Circuit</p>
              <p className="font-medium">₹{(parseFloat(priceInfo.lowerCP) || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Upper Circuit</p>
              <p className="font-medium">₹{(parseFloat(priceInfo.upperCP) || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Price Band</p>
              <p className="font-medium">{priceInfo.pPriceBand || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Base Price</p>
              <p className="font-medium">₹{(priceInfo.basePrice || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">Today's Range</h2>
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span>₹{low.toFixed(2)}</span>
              <span>₹{high.toFixed(2)}</span>
            </div>
            <div className="relative h-2 bg-gray-200 rounded overflow-hidden">
              <div 
                className="absolute h-full bg-blue-600"
                style={{ 
                  width: `${((lastPrice - low) / (high - low)) * 100}%`
                }}
              ></div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-gray-500 text-sm">Current: ₹{lastPrice.toFixed(2)}</p>
              <p className="text-xs text-gray-500">
                {((lastPrice - low) / (high - low) * 100).toFixed(1)}% of today's range
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">Technical Info</h2>
          <div className="grid grid-cols-2 gap-2">
            {priceInfo.ieq && (
              <div>
                <p className="text-gray-500 text-sm">iEQ Value</p>
                <p className="font-medium">{priceInfo.ieq}</p>
              </div>
            )}
            {priceInfo.iNavValue !== null && priceInfo.iNavValue !== undefined && (
              <div>
                <p className="text-gray-500 text-sm">iNAV Value</p>
                <p className="font-medium">₹{priceInfo.iNavValue}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 text-sm">Tick Size</p>
              <p className="font-medium">₹{priceInfo.tickSize || 0}</p>
            </div>
            {priceInfo.stockIndClosePrice !== undefined && priceInfo.stockIndClosePrice !== 0 && (
              <div>
                <p className="text-gray-500 text-sm">Stock Index Close</p>
                <p className="font-medium">₹{priceInfo.stockIndClosePrice}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 text-sm">Check iNAV</p>
              <p className="font-medium">{priceInfo.checkINAV ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>
        
        {stockData.marketStatus && (
          <div className="bg-gray-50 p-4 rounded md:col-span-2">
            <h2 className="text-lg font-semibold mb-3">Market Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stockData.advances !== undefined && (
                <>
                  <div>
                    <p className="text-gray-500 text-sm">Advances</p>
                    <p className="font-medium text-green-600">{stockData.advances}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Declines</p>
                    <p className="font-medium text-red-600">{stockData.declines}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Unchanged</p>
                    <p className="font-medium text-gray-600">{stockData.unchanged}</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-gray-500 text-sm">Market Status</p>
                <p className={`font-medium ${stockData.marketStatus === 'Open' ? 'text-green-600' : 'text-red-600'}`}>
                  {stockData.marketStatus}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockDetails;