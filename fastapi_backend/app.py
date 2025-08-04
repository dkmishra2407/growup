from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, field_validator
from jugaad_data.nse import NSELive
from nsepython import nse_get_top_gainers, nse_get_top_losers
from pymongo import MongoClient
from bson.objectid import ObjectId
from cachetools import TTLCache
from typing import Optional, List, Dict, Any, Set
import pandas as pd
import asyncio
import threading
import time
import json
import os
# import datetime
import logging
import uuid
from dotenv import load_dotenv
from flask import Flask, request, jsonify
import csv
import requests
import time
import json
from datetime import datetime
import feedparser
from typing import List, Dict, Tuple, Optional
import logging
import pandas as pd
from io import StringIO
import pandas as pd
from pymongo import MongoClient
from bson import ObjectId
from flask_cors import CORS
# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="NSE Stock API", description="API for NSE stock data and trading")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize NSE object
nse = NSELive()
# Optional NewsAPI import
try:
    from newsapi.newsapi_client import NewsApiClient
    NEWSAPI_AVAILABLE = True
except ImportError:
    print("NewsAPI not available. Install with: pip install newsapi-python")
    NEWSAPI_AVAILABLE = False
    NewsApiClient = None
# MongoDB connection
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client['Growup']
orders_collection = db['orders']
users = db['users']
exchanges = db['exchanges']
holdings = db['holdings']

# Create indexes for faster queries
orders_collection.create_index([('status', 1)])
orders_collection.create_index([('symbol', 1)])
orders_collection.create_index([('created_at', -1)])

# WebSocket variables
active_connections: Set[WebSocket] = set()
symbol_subscribers: Dict[str, Set[WebSocket]] = {}
price_cache = TTLCache(maxsize=100, ttl=5)  # Cache for 5 seconds

# Track market status
market_open = False


# Helper Functions
def fetch_holdings_from_db(holding_id: str) -> Optional[pd.DataFrame]:
    """Fetch holdings from MongoDB based on holding ID."""
    try:
        holding = holdings.find_one({"HoldingId": holding_id})
        
        if holding and "Holdings" in holding:
            simplified_data = [
                {"Ticker": item["symbol"], "quantity": item["quantity"]}
                for item in holding["Holdings"]
            ]
            
            df = pd.DataFrame(simplified_data)
            logger.info(f"✅ Holdings for ID: {holding_id}")
            logger.info(f"Found {len(df)} holdings")
            return df
        else:
            logger.warning(f"❌ No holding found with HoldingId = {holding_id}")
            return None
            
    except Exception as e:
        logger.error(f"Error fetching holdings from database: {str(e)}")
        return None

class NSEStockAgent:
    """Agent to fetch real-time NSE stock data using your API."""
    
    def __init__(self, api_base_url):
        self.api_base_url = api_base_url
        self.session = requests.Session()
        self.session.timeout = 10
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def fetch_data(self, tickers: List[Tuple[str, float]]) -> List[Dict]:
        """Fetch real-time NSE stock data for given tickers."""
        data = []
        
        for ticker, quantity in tickers:
            try:
                stock_data = self._fetch_from_nse_api(ticker, quantity)
                if stock_data:
                    data.append(stock_data)
                else:
                    # Create error entry if API fails
                    data.append({
                        'ticker': ticker,
                        'quantity': quantity,
                        'lastPrice': 0,
                        'change': 0,
                        'pChange': 0,
                        'error': 'Unable to fetch data from NSE API'
                    })
                        
            except Exception as e:
                logger.error(f"Error fetching data for {ticker}: {str(e)}")
                data.append({
                    'ticker': ticker,
                    'quantity': quantity,
                    'lastPrice': 0,
                    'change': 0,
                    'pChange': 0,
                    'error': str(e)
                })
        
        return data
    
    def _fetch_from_nse_api(self, ticker: str, quantity: float) -> Optional[Dict]:
        """Fetch data from your NSE API endpoint."""
        try:
            data = nse.stock_quote(ticker)
            api_data=data['priceInfo']
            # Extract and structure data according to your API response format
            return {
                'ticker': ticker,
                'quantity': quantity,
                'lastPrice': api_data.get('lastPrice', 0),
                'change': api_data.get('change', 0),
                'pChange': api_data.get('pChange', 0),
                'previousClose': api_data.get('previousClose', 0),
                'open': api_data.get('open', 0),
                'close': api_data.get('close', 0),
                'vwap': api_data.get('vwap', 0),
                'lowerCP': api_data.get('lowerCP', 'N/A'),
                'upperCP': api_data.get('upperCP', 'N/A'),
                'basePrice': api_data.get('basePrice', 0),
                'intraDayHigh': api_data.get('intraDayHighLow', {}).get('max', 0),
                'intraDayLow': api_data.get('intraDayHighLow', {}).get('min', 0),
                'intraDayValue': api_data.get('intraDayHighLow', {}).get('value', 0),
                'weekHigh': api_data.get('weekHighLow', {}).get('max', 0),
                'weekLow': api_data.get('weekHighLow', {}).get('min', 0),
                'weekHighDate': api_data.get('weekHighLow', {}).get('maxDate', 'N/A'),
                'weekLowDate': api_data.get('weekHighLow', {}).get('minDate', 'N/A'),
                'priceBand': api_data.get('pPriceBand', 'N/A'),
                'tickSize': api_data.get('tickSize', 0),
                'timestamp': int(time.time() * 1000)
            }
            
        except requests.RequestException as e:
            logger.warning(f"NSE API request failed for {ticker}: {str(e)}")
            return None
        except (KeyError, ValueError) as e:
            logger.warning(f"NSE API response parsing failed for {ticker}: {str(e)}")
            return None

class NSENewsAgent:
    """Agent to fetch real-time news using various sources."""
    
    def __init__(self, news_api_key: str = None):
        self.news_api_key = news_api_key
        self.newsapi = None
        if NEWSAPI_AVAILABLE and news_api_key:
            try:
                self.newsapi = NewsApiClient(api_key=news_api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize NewsAPI: {str(e)}")
        self.session = requests.Session()
        self.session.timeout = 10
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def fetch_news(self, tickers: List[Tuple[str, float]]) -> Dict[str, List[str]]:
        """Fetch real-time news for given tickers."""
        news_data = {}
        
        for ticker, quantity in tickers:
            try:
                news_items = []
                
                # Try NewsAPI first if available
                if self.newsapi:
                    news_items.extend(self._fetch_from_newsapi(ticker))
                
                # Add RSS feed news from Indian financial sources
                news_items.extend(self._fetch_from_indian_rss(ticker))
                
                # Add Google News for NSE/Indian market
                news_items.extend(self._fetch_from_google_news(ticker))
                
                # Remove duplicates and limit to top 5
                unique_news = list(dict.fromkeys(news_items))[:5]
                news_data[ticker] = unique_news if unique_news else [f"No recent news found for {ticker}"]
                
            except Exception as e:
                logger.error(f"Error fetching news for {ticker}: {str(e)}")
                news_data[ticker] = [f"Error fetching news for {ticker}: {str(e)}"]
        
        return news_data
    
    def _fetch_from_newsapi(self, ticker: str) -> List[str]:
        """Fetch news from NewsAPI."""
        if not self.newsapi:
            return []
        
        try:
            # Search for Indian stock market news
            articles = self.newsapi.get_everything(
                q=f"{ticker} NSE India stock",
                language='en',
                sort_by='publishedAt',
                page_size=3
            )
            
            return [
                f"{article['title']} - {article['source']['name']} ({article['publishedAt'][:10]})"
                for article in articles['articles']
            ]
            
        except Exception as e:
            logger.warning(f"NewsAPI request failed for {ticker}: {str(e)}")
            return []
    
    def _fetch_from_indian_rss(self, ticker: str) -> List[str]:
        """Fetch news from Indian financial RSS feeds."""
        try:
            # Economic Times RSS feed
            rss_url = f"https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms"
            feed = feedparser.parse(rss_url)
            
            # Filter for ticker-related news
            relevant_news = []
            for entry in feed.entries[:10]:  # Check more entries
                if ticker.lower() in entry.title.lower() or ticker.lower() in entry.summary.lower():
                    relevant_news.append(f"{entry.title} - Economic Times ({entry.published[:10]})")
            
            return relevant_news[:3]
            
        except Exception as e:
            logger.warning(f"Indian RSS feed request failed for {ticker}: {str(e)}")
            return []
    
    def _fetch_from_google_news(self, ticker: str) -> List[str]:
        """Fetch news from Google News for Indian market."""
        try:
            # Google News RSS feed with Indian market focus
            rss_url = f"https://news.google.com/rss/search?q={ticker}+NSE+India+stock&hl=en-IN&gl=IN&ceid=IN:en"
            feed = feedparser.parse(rss_url)
            
            return [
                f"{entry.title} - {entry.published[:10]}"
                for entry in feed.entries[:3]
            ]
            
        except Exception as e:
            logger.warning(f"Google News request failed for {ticker}: {str(e)}")
            return []

class NSEWebAgent:
    """Agent to fetch company information for NSE stocks."""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = 10
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def fetch_info(self, tickers: List[Tuple[str, float]]) -> Dict[str, str]:
        """Fetch company information for given NSE tickers."""
        info = {}
        
        for ticker, quantity in tickers:
            try:
                # Basic info about NSE listing
                info[ticker] = (
                    f"{ticker} is listed on the National Stock Exchange (NSE) of India. "
                    f"This is an NSE equity stock trading in the Indian market. "
                    f"For detailed company information, please refer to NSE official website "
                    f"or company's annual reports."
                )
                
            except Exception as e:
                logger.error(f"Error fetching web info for {ticker}: {str(e)}")
                info[ticker] = f"Unable to fetch web information for {ticker}: {str(e)}"
        
        return info

class NSEPortfolioAgent:
    """Main coordinating agent for NSE portfolio using real-time data."""
    
    def __init__(self, api_base_url,news_api_key: str = None):
        self.stock_agent = NSEStockAgent(api_base_url)
        self.news_agent = NSENewsAgent(news_api_key)
        self.web_agent = NSEWebAgent()
    
    def generate_report(self, tickers: List[Tuple[str, float]]) -> str:
        """Generate comprehensive real-time NSE portfolio report."""
        logger.info("Starting NSE real-time portfolio report generation...")
        
        # Fetch data from all agents
        real_time_data = self.stock_agent.fetch_data(tickers)
        web_info = self.web_agent.fetch_info(tickers)
        news_data = self.news_agent.fetch_news(tickers)
        
        # Build the report
        report_lines = []
        report_lines.append("🔴 NSE REAL-TIME PORTFOLIO REPORT")
        report_lines.append("=" * 50)
        report_lines.append(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report_lines.append(f"Market: National Stock Exchange (NSE) - India")
        report_lines.append("")
        
        # Calculate portfolio summary
        total_value = 0
        total_change_value = 0
        
        # Real-Time NSE Stock Data Section
        report_lines.append("📊 REAL-TIME NSE STOCK DATA:")
        report_lines.append("-" * 35)
        
        for item in real_time_data:
            ticker = item['ticker']
            quantity = item['quantity']
            
            if 'error' in item:
                report_lines.append(f"❌ {ticker}: ERROR - {item['error']}")
                report_lines.append("")
                continue
            
            lastPrice = item['lastPrice']
            change = item['change']
            pChange = item['pChange']
            
            status_emoji = "🟢" if change >= 0 else "🔴"
            
            # Calculate holding value
            holding_value = lastPrice * quantity if quantity > 0 else 0
            change_value = change * quantity if quantity > 0 else 0
            
            total_value += holding_value
            total_change_value += change_value
            
            report_lines.append(f"{status_emoji} {ticker}:")
            report_lines.append(f"    Last Price: ₹{lastPrice:.2f}")
            report_lines.append(f"    Change: ₹{change:+.2f} ({pChange:+.2f}%)")
            report_lines.append(f"    Previous Close: ₹{item['previousClose']:.2f}")
            report_lines.append(f"    Open: ₹{item['open']:.2f}")
            report_lines.append(f"    VWAP: ₹{item['vwap']:.2f}")
            report_lines.append(f"    Day Range: ₹{item['intraDayLow']:.2f} - ₹{item['intraDayHigh']:.2f}")
            report_lines.append(f"    52W Range: ₹{item['weekLow']:.2f} - ₹{item['weekHigh']:.2f}")
            report_lines.append(f"    Circuit Limits: ₹{item['lowerCP']} - ₹{item['upperCP']}")
            report_lines.append(f"    Price Band: {item['priceBand']}")
            
            if quantity > 0:
                report_lines.append(f"    Holdings: {quantity} shares")
                report_lines.append(f"    Holding Value: ₹{holding_value:.2f}")
                report_lines.append(f"    Day P&L: ₹{change_value:+.2f}")
            
            report_lines.append("")
        
        # Portfolio Summary
        if total_value > 0:
            report_lines.append("💰 PORTFOLIO SUMMARY:")
            report_lines.append("-" * 20)
            report_lines.append(f"Total Portfolio Value: ₹{total_value:.2f}")
            report_lines.append(f"Total Day P&L: ₹{total_change_value:+.2f}")
            if total_value > 0:
                portfolio_pchange = (total_change_value / (total_value - total_change_value)) * 100
                report_lines.append(f"Portfolio Day Change: {portfolio_pchange:+.2f}%")
            report_lines.append("")
        
        # Company Information Section
        report_lines.append("🏢 COMPANY INFORMATION:")
        report_lines.append("-" * 25)
        for ticker, info in web_info.items():
            report_lines.append(f"• {ticker}: {info}")
        report_lines.append("")
        
        # News Section
        report_lines.append("📰 LATEST NEWS:")
        report_lines.append("-" * 15)
        for ticker, news_items in news_data.items():
            report_lines.append(f"• {ticker}:")
            for news_item in news_items:
                report_lines.append(f"    - {news_item}")
            report_lines.append("")
        
        report_lines.append("=" * 50)
        report_lines.append("🇮🇳 NSE India Market Report completed successfully!")
        
        return "\n".join(report_lines)

def load_portfolio_from_dataframe(df: pd.DataFrame) -> List[Tuple[str, float]]:
    """Load portfolio data from dataframe format."""
    try:
        # Extract ticker and quantity pairs
        portfolio = []
        
        # Find ticker column (assuming 'Ticker' from your MongoDB structure)
        ticker_col = 'Ticker'
        quantity_col = 'quantity'
        
        # Validate columns exist
        if ticker_col not in df.columns or quantity_col not in df.columns:
            logger.error(f"Required columns not found. Expected: {ticker_col}, {quantity_col}")
            return []
        
        # Convert to list of tuples
        for _, row in df.iterrows():
            ticker = str(row[ticker_col]).strip()
            try:
                quantity = float(row[quantity_col])
            except (ValueError, TypeError):
                quantity = 0.0
            
            portfolio.append((ticker, quantity))
        
        return portfolio
        
    except Exception as e:
        logger.error(f"Error loading portfolio from dataframe: {str(e)}")
        return []
    
def check_market_status():
    """Check if the market is currently open"""
    try:
        status = nse.market_status()
        market_states = status['marketState']
        for market in market_states:
            if market['market'] == 'Capital Market' and market['marketStatus'] == 'Open':
                return True
        return False
    except Exception as e:
        logger.error(f"Error checking market status: {e}")
        return False

def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if not doc:
        return doc
    doc_copy = doc.copy()
    for key, value in doc_copy.items():
        if isinstance(value, ObjectId):
            doc_copy[key] = str(value)
        elif isinstance(value, datetime):
            doc_copy[key] = value.isoformat()
    return doc_copy

# WebSocket Functions
async def format_stock_data(symbol, quote):
    """Format stock data to match the expected format in the frontend"""
    try:
        price_info = quote.get("priceInfo", {})
        security_info = quote.get("securityInfo", {})
        metadata = quote.get("metadata", {})
        
        return {
            "T": "q",  # Type: quote
            "S": symbol,
            # Basic price info
            "lastPrice": price_info.get("lastPrice", 0),
            "open": price_info.get("open", 0),
            "close": price_info.get("close", 0),
            "change": price_info.get("change", 0),
            "pChange": price_info.get("pChange", 0),
            "previousClose": price_info.get("previousClose", 0),
            "vwap": price_info.get("vwap", 0),
            
            # High/Low info
            "intraDayHighLow": {
                "max": price_info.get("intraDayHighLow", {}).get("max", 0),
                "min": price_info.get("intraDayHighLow", {}).get("min", 0)
            },
            "weekHighLow": {
                "max": price_info.get("weekHighLow", {}).get("max", 0),
                "min": price_info.get("weekHighLow", {}).get("min", 0),
                "maxDate": price_info.get("weekHighLow", {}).get("maxDate", ""),
                "minDate": price_info.get("weekHighLow", {}).get("minDate", "")
            },
            
            # Circuit limits
            "upperCP": price_info.get("upperCP", 0),
            "lowerCP": price_info.get("lowerCP", 0),
            "pPriceBand": price_info.get("pPriceBand", "N/A"),
            "basePrice": price_info.get("basePrice", 0),
            
            # Technical info
            "ieq": security_info.get("ieq", ""),
            "iNavValue": metadata.get("iNavValue", 0),
            "tickSize": security_info.get("tickSize", 0.05),
            "stockIndClosePrice": metadata.get("stockIndClosePrice", 0),
            "checkINAV": metadata.get("checkINAV", False),
            
            # Market status
            "marketStatus": metadata.get("market", "Closed"),
            "advances": metadata.get("advances", 0),
            "declines": metadata.get("declines", 0),
            "unchanged": metadata.get("unchanged", 0),
            
            # Symbol info
            "symbol": symbol,
            "name": security_info.get("companyName", symbol),
            "indexSymbol": security_info.get("index", ""),
            
            # Timestamp
            "timestamp": int(time.time() * 1000)
        }
    except Exception as e:
        logger.error(f"Error formatting stock data for {symbol}: {str(e)}")
        return {
            "T": "error",
            "S": symbol,
            "message": f"Error formatting data: {str(e)}"
        }

async def fetch_price(symbol):
    """Fetch and cache price data for a symbol"""
    try:
        # Cache hit
        if symbol in price_cache:
            return price_cache[symbol]

        # Live fetch
        quote = nse.stock_quote(symbol)
        data = await format_stock_data(symbol, quote)
        
        # Cache the data
        price_cache[symbol] = data
        return data
    except Exception as e:
        logger.error(f"Error fetching price for {symbol}: {str(e)}")
        return {
            "T": "error",
            "S": symbol,
            "message": f"Error fetching data: {str(e)}"
        }

async def price_broadcast_loop():
    """Background task to broadcast price updates to WebSocket clients"""
    while True:
        try:
            for symbol, clients in list(symbol_subscribers.items()):
                if not clients:
                    continue
                
                data = await fetch_price(symbol)
                disconnected = []
                
                for client in clients:
                    try:
                        await client.send_json(data)
                    except Exception as e:
                        logger.error(f"Error sending to client: {str(e)}")
                        disconnected.append(client)
                
                # Remove disconnected clients
                for dc in disconnected:
                    clients.discard(dc)
                
                # Clean up empty subscriptions
                if not clients:
                    del symbol_subscribers[symbol]
                    
            await asyncio.sleep(3)  # Update every 3 seconds
            
        except Exception as e:
            logger.error(f"Error in price broadcast loop: {str(e)}")
            await asyncio.sleep(1)  # Wait before retrying

# API Models (for documentation)
class OrderRequest(BaseModel):
    symbol: str
    quantity: int
    order_type: str
    target_price: float
    Email: str
    OrderId: str
    HoldingId: str

# WebSocket Endpoints
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time stock data"""
    await websocket.accept()
    active_connections.add(websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            symbol = data.get("symbol", "").upper()

            if action == "subscribe" and symbol:
                # Validate the stock symbol
                try:
                    quote = nse.stock_quote(symbol)
                    if quote and "priceInfo" in quote:
                        # Create subscription entry if it doesn't exist
                        if symbol not in symbol_subscribers:
                            symbol_subscribers[symbol] = set()
                        
                        symbol_subscribers[symbol].add(websocket)
                        await websocket.send_json({"message": f"Subscribed to {symbol}"})
                        
                        # Send initial data immediately
                        initial_data = await format_stock_data(symbol, quote)
                        await websocket.send_json(initial_data)
                    else:
                        await websocket.send_json({"error": f"Invalid stock symbol: {symbol}"})
                except Exception as e:
                    logger.error(f"Error subscribing to {symbol}: {str(e)}")
                    await websocket.send_json({"error": f"Error subscribing to {symbol}: {str(e)}"})

            elif action == "unsubscribe" and symbol:
                if symbol in symbol_subscribers:
                    symbol_subscribers[symbol].discard(websocket)
                    await websocket.send_json({"message": f"Unsubscribed from {symbol}"})
                    
                    # Remove empty subscription sets to save memory
                    if not symbol_subscribers[symbol]:
                        del symbol_subscribers[symbol]

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
        active_connections.discard(websocket)
        for symbol, subscribers in list(symbol_subscribers.items()):
            subscribers.discard(websocket)
            if not subscribers:
                del symbol_subscribers[symbol]
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        active_connections.discard(websocket)

# REST API Endpoints
@app.get("/report_generation/{holding_id}")
async def generate_report(holding_id: str):
    """Generate NSE portfolio report for given holding ID."""
    try:
        if not holding_id:
            raise HTTPException(status_code=400, detail="No holding_id provided")

        holdings_df = fetch_holdings_from_db(holding_id)

        if holdings_df is None or holdings_df.empty:
            raise HTTPException(
                status_code=404, 
                detail={
                    'error': 'No holdings found',
                    'message': f'No holdings found for holding_id: {holding_id}'
                }
            )

        portfolio = load_portfolio_from_dataframe(holdings_df)
        if not portfolio:
            raise HTTPException(status_code=500, detail="Invalid portfolio data")

        portfolio_agent = NSEPortfolioAgent(
            api_base_url=None,
            news_api_key=None
        )

        report = portfolio_agent.generate_report(portfolio)

        return {
            'success': True,
            'holding_id': holding_id,
            'report': report,
            'portfolio_count': len(portfolio),
            'holdings_data': holdings_df.to_dict('records'),
            'generated_at': datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        raise HTTPException(status_code=500, detail={'error': 'Internal Server Error', 'message': str(e)})
    
@app.get("/")
async def root():
    """Root endpoint that returns a simple HTML page"""
    try:
        return HTMLResponse(content="""
        <html>
            <head>
                <title>NSE Stock API</title>
            </head>
            <body>
                <h1>NSE Stock API</h1>
                <p>API Documentation is available at <a href="/docs">/docs</a></p>
            </body>
        </html>
        """)
    except Exception as e:
        logger.error(f"Error serving root page: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.get("/api/search/{query}")
async def search_stocks(query: str):
    """Search for stocks by query string"""
    try:
        search_results = nse.search_stock(query.upper())
        return {"results": search_results}
    except Exception as e:
        logger.error(f"Error searching stocks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching stocks: {str(e)}")

@app.get("/api/validate/{symbol}")
async def validate_stock(symbol: str):
    """Validate if a stock symbol exists"""
    try:
        quote = nse.stock_quote(symbol.upper())
        if quote and "priceInfo" in quote:
            return {"valid": True, "symbol": symbol.upper()}
        return {"valid": False}
    except Exception as e:
        logger.error(f"Error validating stock {symbol}: {str(e)}")
        return {"valid": False}

@app.get("/api/graph-data/{symbol}")
async def get_graph_data(symbol: str):
    """Get graph data for a stock"""
    try:
        # This is a placeholder - you'll need to implement the actual historical data fetching
        current_time = int(time.time() * 1000)
        one_day_ago = current_time - (24 * 60 * 60 * 1000)
        
        # Get current price for reference
        quote = nse.stock_quote(symbol.upper())
        current_price = quote.get("priceInfo", {}).get("lastPrice", 100)
        
        # Generate some price movements around the current price
        import random
        data_points = []
        for i in range(100):
            timestamp = one_day_ago + (i * 14.4 * 60 * 1000)  # 14.4 minutes intervals
            price = current_price * (0.9 + 0.2 * random.random())  # ±10% variation
            data_points.append([timestamp, price])
        
        return data_points
    except Exception as e:
        logger.error(f"Error fetching graph data for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching graph data: {str(e)}")
class OrderRequest(BaseModel):
    symbol: str
    quantity: int
    order_type: str
    target_price: float
    Email: str
    OrderId: str
    HoldingId: str
    
    @field_validator('symbol')
    def validate_symbol(cls, v):
        if not v or not v.strip():
            raise ValueError('Symbol cannot be empty')
        return v.strip().upper()
    
    @field_validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be positive')
        return v
    
    @field_validator('target_price')
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('Price must be positive')
        return v
    
    @field_validator('order_type')
    def validate_order_type(cls, v):
        if v.upper() not in ['BUY', 'SELL']:
            raise ValueError('Order type must be BUY or SELL')
        return v.upper()
    
    @field_validator('Email')
    def validate_email(cls, v):
        if not v or not v.strip():
            raise ValueError('Email cannot be empty')
        return v.strip()
    
    @field_validator('OrderId')
    def validate_order_id(cls, v):
        if not v or not v.strip():
            raise ValueError('OrderId cannot be empty')
        return v.strip()
    
    @field_validator('HoldingId')
    def validate_holding_id(cls, v):
        if not v or not v.strip():
            raise ValueError('HoldingId cannot be empty')
        return v.strip()

@app.post("/api/place-order")
async def place_order(order_data: OrderRequest):
    """Place a buy or sell order"""
    try:
        # Log the received data for debugging
        logger.info(f"Processing order request: {order_data.model_dump()}")
        
        data = order_data.model_dump()
        
        # Extract validated data
        symbol = data['symbol']
        quantity = data['quantity']
        order_type = data['order_type']
        target_price = data['target_price']
        email = data['Email']
        order_id = data['OrderId']
        holding_id = data['HoldingId']

        # Uncomment to enable market hours check
        # market_open = check_market_status()
        # if not market_open:
        #     return JSONResponse(
        #         status_code=400,
        #         content={"error": "Market is closed. Cannot place orders."}
        #     )

        # Fetch user data
        user = users.find_one({'Email': email})
        if not user:
            logger.error(f"User not found for email: {email}")
            return JSONResponse(
                status_code=404, 
                content={"error": "User not found"}
            )

        # Check user balance
        user_balance = float(user.get('Balance', 0))
        logger.info(f"User balance: {user_balance}")

        # Validate holdings for SELL orders
        if order_type == 'SELL':
            holding = holdings.find_one({'HoldingId': holding_id})
            if not holding:
                logger.error(f"Holding not found for HoldingId: {holding_id}")
                return JSONResponse(
                    status_code=404, 
                    content={"error": "Holding not found"}
                )

            existing_holding = next((h for h in holding.get('Holdings', []) if h['symbol'] == symbol), None)
            if not existing_holding:
                return JSONResponse(
                    status_code=400,
                    content={"error": f"No holdings found for symbol {symbol}"}
                )
            
            if existing_holding['quantity'] < quantity:
                return JSONResponse(
                    status_code=400,
                    content={"error": f"Insufficient holdings. Available: {existing_holding['quantity']}, Requested: {quantity}"}
                )

        # Check balance for BUY orders
        total_cost = quantity * target_price
        if order_type == 'BUY' and user_balance < total_cost:
            return JSONResponse(
                status_code=400,
                content={"error": f"Insufficient balance. Required: ${total_cost:.2f}, Available: ${user_balance:.2f}"}
            )

        # Generate unique order ID
        import uuid
        unique_order_id = str(uuid.uuid4())

        # Create order object
        order = {
            'OrderId': unique_order_id,
            'symbol': symbol,
            'quantity': quantity,
            'order_type': order_type,
            'target_price': target_price,
            'Email': email,
            'HoldingId': holding_id,
            'created_at': datetime.now(),
            'status': 'EXECUTED',  # Assume instant execution for simplicity
            'total_amount': total_cost
        }

        # Insert order into collection
        result = orders_collection.insert_one(order)
        order['_id'] = result.inserted_id
        logger.info(f"Order created with ID: {result.inserted_id}")

        # Process BUY order
        if order_type == 'BUY':
            # Update user balance
            new_balance = user_balance - total_cost
            users.update_one(
                {'_id': user['_id']}, 
                {'$set': {'Balance': new_balance}}
            )
            logger.info(f"Updated user balance from {user_balance} to {new_balance}")

            # Update holdings
            holding = holdings.find_one({'HoldingId': holding_id})
            if not holding:
                # Create new holding document
                holding = {
                    'HoldingId': holding_id,
                    'Holdings': []
                }
                holdings.insert_one(holding)
                logger.info(f"Created new holding for HoldingId: {holding_id}")

            # Find existing holding for this symbol
            existing_holding_index = -1
            for i, h in enumerate(holding.get('Holdings', [])):
                if h['symbol'] == symbol:
                    existing_holding_index = i
                    break

            if existing_holding_index >= 0:
                # Update existing holding
                existing_holding = holding['Holdings'][existing_holding_index]
                total_qty = existing_holding['quantity'] + quantity
                avg_price = ((existing_holding['quantity'] * existing_holding['price']) +
                           (quantity * target_price)) / total_qty

                holding['Holdings'][existing_holding_index] = {
                    'symbol': symbol,
                    'quantity': total_qty,
                    'price': avg_price
                }
                logger.info(f"Updated existing holding for {symbol}: quantity={total_qty}, avg_price={avg_price}")
            else:
                # Add new holding
                holding['Holdings'].append({
                    'symbol': symbol,
                    'quantity': quantity,
                    'price': target_price
                })
                logger.info(f"Added new holding for {symbol}: quantity={quantity}, price={target_price}")

            # Update holding document
            holdings.update_one(
                {'HoldingId': holding_id}, 
                {'$set': {'Holdings': holding['Holdings']}}
            )

        # Process SELL order
        else:
            # Update user balance
            new_balance = user_balance + total_cost
            users.update_one(
                {'_id': user['_id']}, 
                {'$set': {'Balance': new_balance}}
            )
            logger.info(f"Updated user balance from {user_balance} to {new_balance}")

            # Update holdings
            holding = holdings.find_one({'HoldingId': holding_id})
            updated_holdings = []
            
            for h in holding.get('Holdings', []):
                if h['symbol'] == symbol:
                    remaining_quantity = h['quantity'] - quantity
                    if remaining_quantity > 0:
                        h['quantity'] = remaining_quantity
                        updated_holdings.append(h)
                    # If quantity becomes 0, don't add to updated_holdings
                    logger.info(f"Sold {quantity} shares of {symbol}, remaining: {remaining_quantity}")
                else:
                    updated_holdings.append(h)

            # Update or delete holding document
            if updated_holdings:
                holdings.update_one(
                    {'HoldingId': holding_id}, 
                    {'$set': {'Holdings': updated_holdings}}
                )
            else:
                holdings.delete_one({'HoldingId': holding_id})
                logger.info(f"Deleted empty holding document for HoldingId: {holding_id}")

        # Return success response
        response_data = {
            "message": f"{order_type} order placed successfully",
            "order_id": str(order['_id']),
            "order": {
                "OrderId": order['OrderId'],
                "symbol": order['symbol'],
                "quantity": order['quantity'],
                "order_type": order['order_type'],
                "target_price": order['target_price'],
                "total_amount": order['total_amount'],
                "status": order['status'],
                "created_at": order['created_at'].isoformat()
            }
        }
        
        logger.info(f"Order processed successfully: {response_data}")
        return JSONResponse(
            status_code=200,
            content=response_data
        )

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return JSONResponse(
            status_code=422,
            content={"error": f"Validation failed: {str(e)}"}
        )
    except Exception as e:
        logger.error(f"Order placement error: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": f"An error occurred while processing your order: {str(e)}"}
        )

@app.get("/api/gainer-losers")
async def get_gainers_and_losers():
    """Get top gainers and losers for the day"""
    try:
        gainers = nse_get_top_gainers()
        losers = nse_get_top_losers()

        gainers_df = pd.DataFrame(gainers)
        losers_df = pd.DataFrame(losers)
        
        return {
            "gainers": gainers_df.to_dict(orient="records"),
            "losers": losers_df.to_dict(orient="records")
        }
    except Exception as e:
        logger.error(f"Error fetching gainers and losers: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Error fetching gainers and losers: {str(e)}"}
        )

@app.get("/api/orders")
async def get_orders(status: Optional[str] = None, symbol: Optional[str] = None):
    """Get all orders with optional filtering"""
    try:
        # Build query
        query = {}
        if status:
            query['status'] = status.upper()
        if symbol:
            query['symbol'] = symbol.upper()
        
        # Get orders
        orders_cursor = orders_collection.find(query).sort('created_at', -1)
        orders = []
        
        for order in orders_cursor:
            orders.append(serialize_doc(order))
        
        return {
            "orders": orders,
            "count": len(orders),
            "market_open": check_market_status()
        }
    except Exception as e:
        logger.error(f"Error fetching orders: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Error fetching orders: {str(e)}"}
        )

@app.get("/api/orders/{id}")
async def get_order(id: str):
    """Get all orders for an ExchangeId"""
    try:
        # Find all orders for the email
        orders = list(orders_collection.find({'Email': id}).sort('created_at', -1))
        if orders:
            return {
                "orders": [serialize_doc(order) for order in orders],
                "count": len(orders)
            }
            
        return JSONResponse(
            status_code=404,
            content={"error": "No orders found"}
        )
    except Exception as e:
        logger.error(f"Error fetching orders for {id}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Error fetching orders: {str(e)}"}
        )

@app.get("/api/market-status")
async def api_market_status():
    """Get current market status"""
    try:
        status = nse.market_status()
        is_open = check_market_status()
        return {
            'marketState': status['marketState'],
            'isOpen': is_open
        }
    except Exception as e:
        logger.error(f"Error fetching market status: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Error fetching market status: {str(e)}"}
        )

@app.get("/api/stock-quote/{symbol}")
async def api_stock_quote(symbol: str):
    """Get current stock quote"""
    try:
        quote = nse.stock_quote(symbol.upper())
        return quote['priceInfo']
    except Exception as e:
        logger.error(f"Error fetching stock quote for {symbol}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Error fetching stock quote: {str(e)}"}
        )

@app.get("/api/indices")
async def api_indices():
    """Get current indices data"""
    try:
        indices = nse.all_indices()
        return indices
    except Exception as e:
        logger.error(f"Error fetching indices: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Error fetching indices: {str(e)}"}
        )

# Startup and Shutdown Events
@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("Starting NSE Stock API")
    global market_open
    market_open = check_market_status()
    logger.info(f"Market status: {'Open' if market_open else 'Closed'}")
    
    # Start the WebSocket broadcast loop
    asyncio.create_task(price_broadcast_loop())

@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("Shutting down NSE Stock API")

# Run the application
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5003))
    uvicorn.run(app, host="0.0.0.0", port=port)
