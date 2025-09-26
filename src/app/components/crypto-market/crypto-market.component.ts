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
  private dataSubscription!: Subscription;

  constructor(private cryptoService: CryptoService) { }

  ngOnInit(): void {
    this.dataSubscription = this.cryptoService.getCryptoData().subscribe(data => {
      this.cryptoData = data;
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
}