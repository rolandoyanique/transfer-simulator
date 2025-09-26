import { Injectable, OnDestroy } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface CryptoCurrency {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CryptoService implements OnDestroy {
  private cryptoDataSubject = new BehaviorSubject<CryptoCurrency[]>([]);
  private ws: WebSocket | null = null;
  private apiKey = 'd3bfj5pr01qqg7bude80d3bfj5pr01qqg7bude8g'; // API key gratuita de Finnhub (puedes reemplazarla)
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval: any;
  
  // Símbolos de criptomonedas populares
  private cryptoSymbols = [
    'BINANCE:BTCUSDT', // Bitcoin
    'BINANCE:ETHUSDT', // Ethereum
    'BINANCE:ADAUSDT', // Cardano
    'BINANCE:DOTUSDT', // Polkadot
    'BINANCE:SOLUSDT', // Solana
    'BINANCE:DOGEUSDT', // Dogecoin
    'BINANCE:MATICUSDT', // Polygon
    'BINANCE:LTCUSDT' // Litecoin
  ];

  private cryptoMap: { [key: string]: CryptoCurrency } = {
    'BINANCE:BTCUSDT': { symbol: 'BTC', name: 'Bitcoin', price: 0, change: 0, changePercent: 0, lastUpdate: new Date() },
    'BINANCE:ETHUSDT': { symbol: 'ETH', name: 'Ethereum', price: 0, change: 0, changePercent: 0, lastUpdate: new Date() },
    'BINANCE:ADAUSDT': { symbol: 'ADA', name: 'Cardano', price: 0, change: 0, changePercent: 0, lastUpdate: new Date() },
    'BINANCE:DOTUSDT': { symbol: 'DOT', name: 'Polkadot', price: 0, change: 0, changePercent: 0, lastUpdate: new Date() },
    'BINANCE:SOLUSDT': { symbol: 'SOL', name: 'Solana', price: 0, change: 0, changePercent: 0, lastUpdate: new Date() },
    'BINANCE:DOGEUSDT': { symbol: 'DOGE', name: 'Dogecoin', price: 0, change: 0, changePercent: 0, lastUpdate: new Date() },
    'BINANCE:MATICUSDT': { symbol: 'MATIC', name: 'Polygon', price: 0, change: 0, changePercent: 0, lastUpdate: new Date() },
    'BINANCE:LTCUSDT': { symbol: 'LTC', name: 'Litecoin', price: 0, change: 0, changePercent: 0, lastUpdate: new Date() }
  };

  constructor() {
    this.initializeWebSocket();
  }

  getCryptoData(): Observable<CryptoCurrency[]> {
    return this.cryptoDataSubject.asObservable();
  }

  private initializeWebSocket() {
    try {
      if (!this.apiKey || this.apiKey === 'd3bfj5pr01qqg7bude80d3bfj5pr01qqg7bude8g') {
        console.warn('Finnhub API key no configurada. Usando datos simulados.');
        this.simulateWebSocketData();
        return;
      }

      this.ws = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);
      
      this.ws.onopen = () => {
        console.log('WebSocket conectado a Finnhub');
        this.reconnectAttempts = 0;
        
        // Suscribirse a los símbolos de criptomonedas
        this.cryptoSymbols.forEach(symbol => {
          this.ws?.send(JSON.stringify({ type: 'subscribe', symbol }));
        });
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket desconectado:', event.code, event.reason);
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Error en WebSocket:', error);
      };

      // Timeout para verificar si la conexión se estableció correctamente
      setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          console.warn('WebSocket no se pudo conectar. Usando datos simulados.');
          this.simulateWebSocketData();
        }
      }, 5000);

    } catch (error) {
      console.error('Error al inicializar WebSocket:', error);
      this.simulateWebSocketData();
    }
  }

  private handleWebSocketMessage(data: any) {
    if (data.type === 'trade') {
      this.processTradeData(data.data);
    } else if (data.type === 'ping') {
      // Responder a ping para mantener la conexión activa
      this.ws?.send(JSON.stringify({ type: 'pong' }));
    } else if (data.type === 'error') {
      console.error('Error del servidor Finnhub:', data.msg);
    }
  }

  private processTradeData(tradeData: any[]) {
    if (!tradeData || !Array.isArray(tradeData)) return;

    tradeData.forEach(trade => {
      const { s: symbol, p: price } = trade;
      
      if (this.cryptoMap[symbol]) {
        const previousPrice = this.cryptoMap[symbol].price;
        const change = price - previousPrice;
        const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

        this.cryptoMap[symbol] = {
          ...this.cryptoMap[symbol],
          price: parseFloat(price.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
          lastUpdate: new Date()
        };
      }
    });

    // Emitir los datos actualizados
    this.cryptoDataSubject.next(Object.values(this.cryptoMap));
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Máximo de intentos de reconexión alcanzado. Usando datos simulados.');
      this.simulateWebSocketData();
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff

    console.log(`Reconectando en ${delay}ms (intento ${this.reconnectAttempts})`);
    
    this.reconnectInterval = setTimeout(() => {
      this.initializeWebSocket();
    }, delay);
  }

  private simulateWebSocketData() {
    console.log('Iniciando simulación de datos de criptomonedas');
    
    // Datos iniciales realistas
    const initialData: CryptoCurrency[] = [
      { symbol: 'BTC', name: 'Bitcoin', price: 45000, change: 250, changePercent: 0.56, lastUpdate: new Date() },
      { symbol: 'ETH', name: 'Ethereum', price: 3000, change: -45, changePercent: -1.48, lastUpdate: new Date() },
      { symbol: 'ADA', name: 'Cardano', price: 2.5, change: 0.1, changePercent: 4.17, lastUpdate: new Date() },
      { symbol: 'DOT', name: 'Polkadot', price: 20, change: -0.5, changePercent: -2.44, lastUpdate: new Date() },
      { symbol: 'SOL', name: 'Solana', price: 150, change: 5.5, changePercent: 3.8, lastUpdate: new Date() },
      { symbol: 'DOGE', name: 'Dogecoin', price: 0.15, change: -0.01, changePercent: -6.25, lastUpdate: new Date() },
      { symbol: 'MATIC', name: 'Polygon', price: 0.85, change: 0.02, changePercent: 2.41, lastUpdate: new Date() },
      { symbol: 'LTC', name: 'Litecoin', price: 75, change: -1.2, changePercent: -1.57, lastUpdate: new Date() }
    ];

    this.cryptoDataSubject.next(initialData);

    // Simular actualizaciones en tiempo real
    setInterval(() => {
      const currentData = this.cryptoDataSubject.value.map(crypto => {
        const volatility = crypto.symbol === 'BTC' ? 0.02 : 
                          crypto.symbol === 'ETH' ? 0.03 : 0.05;
        
        const change = (Math.random() - 0.5) * volatility * crypto.price;
        const newPrice = Math.max(0.01, crypto.price + change);
        const changePercent = ((newPrice - crypto.price) / crypto.price) * 100;
        
        return {
          ...crypto,
          price: parseFloat(newPrice.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
          lastUpdate: new Date()
        };
      });
      
      this.cryptoDataSubject.next(currentData);
    }, 3000); // Actualizar cada 3 segundos
  }

  unsubscribeFromSymbols() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.cryptoSymbols.forEach(symbol => {
        this.ws?.send(JSON.stringify({ type: 'unsubscribe', symbol }));
      });
    }
  }

  ngOnDestroy() {
    this.unsubscribeFromSymbols();
    
    if (this.ws) {
      this.ws.close();
    }
    
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }
  }
}