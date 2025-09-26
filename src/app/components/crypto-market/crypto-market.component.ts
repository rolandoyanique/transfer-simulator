import { Component, OnInit, OnDestroy } from '@angular/core';
import { CryptoService, CryptoCurrency } from '../../services/crypto.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-crypto-market',
  templateUrl: './crypto-market.component.html',
  styleUrls: ['./crypto-market.component.scss']
})
export class CryptoMarketComponent implements OnInit, OnDestroy {
  cryptoData: CryptoCurrency[] = [];
  isLoading = true;
  lastUpdate: Date = new Date();
  isRealTime = false;
  private dataSubscription!: Subscription;

  constructor(private cryptoService: CryptoService) { }

  ngOnInit(): void {
    this.dataSubscription = this.cryptoService.getCryptoData().subscribe(data => {
      this.cryptoData = data;
      this.isLoading = false;
      this.lastUpdate = new Date();
      
      // Detectar si estamos usando datos en tiempo real o simulados
      this.isRealTime = data.some(crypto => crypto.lastUpdate.getTime() > Date.now() - 10000);
    });
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  getChangeClass(change: number): string {
    return change >= 0 ? 'up' : 'down';
  }

  formatLastUpdate(): string {
    const now = new Date();
    const diff = now.getTime() - this.lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `Hace ${seconds} segundos`;
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} minutos`;
    return `Hace ${Math.floor(seconds / 3600)} horas`;
  }

  refreshData(): void {
    this.isLoading = true;
    // En una implementación real, esto recargaría la conexión WebSocket
    setTimeout(() => this.isLoading = false, 1000);
  }
}