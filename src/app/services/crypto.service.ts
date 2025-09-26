import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface CryptoCurrency {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private cryptoDataSubject = new BehaviorSubject<CryptoCurrency[]>([]);
  private ws: WebSocket | null = null;
  private reconnectInterval: any;

  constructor() {
    this.initializeWebSocket();
  }

  getCryptoData(): Observable<CryptoCurrency[]> {
    return this.cryptoDataSubject.asObservable();
  }

  private initializeWebSocket() {
    try {
      // For demo purposes, we'll simulate WebSocket data since Finnhub requires API key
      this.simulateWebSocketData();
      
      // Uncomment and use the following if you have a Finnhub API key
      /*
      this.ws = new WebSocket('wss://ws.finnhub.io?token=YOUR_API_KEY');
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        // Subscribe to crypto symbols
        ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'BINANCE:ADAUSDT'].forEach(symbol => {
          this.ws?.send(JSON.stringify({ type: 'subscribe', symbol }));
        });
      };
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'trade') {
          this.processTradeData(data.data);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.scheduleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      */
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.simulateWebSocketData();
    }
  }

  private simulateWebSocketData() {
    // Simulate real-time crypto data updates
    const initialData: CryptoCurrency[] = [
      { symbol: 'BTC', name: 'Bitcoin', price: 45000, change: 250, changePercent: 0.56 },
      { symbol: 'ETH', name: 'Ethereum', price: 3000, change: -45, changePercent: -1.48 },
      { symbol: 'ADA', name: 'Cardano', price: 2.5, change: 0.1, changePercent: 4.17 },
      { symbol: 'DOT', name: 'Polkadot', price: 20, change: -0.5, changePercent: -2.44 }
    ];
    
    this.cryptoDataSubject.next(initialData);
    
    // Update prices every 5 seconds to simulate real-time data
    setInterval(() => {
      const currentData = this.cryptoDataSubject.value.map(crypto => {
        const change = (Math.random() - 0.5) * 100;
        const newPrice = Math.max(1, crypto.price + change);
        const changePercent = ((newPrice - crypto.price) / crypto.price) * 100;
        
        return {
          ...crypto,
          price: parseFloat(newPrice.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2))
        };
      });
      
      this.cryptoDataSubject.next(currentData);
    }, 5000);
  }

  private processTradeData(tradeData: any[]) {
    // Process real trade data from Finnhub
    // This would be implemented with a real API key
  }

  private scheduleReconnect() {
    this.reconnectInterval = setTimeout(() => {
      this.initializeWebSocket();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.ws) {
      this.ws.close();
    }
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }
  }
}