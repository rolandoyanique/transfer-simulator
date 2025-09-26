import { Injectable } from '@angular/core';
import { Transfer, DashboardStats } from '../models/account.model';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TransferService {
  private transfersKey = 'bank-transfers';
  private transfersSubject = new BehaviorSubject<Transfer[]>(this.getStoredTransfers());

  constructor() { }

  getTransfers(): Observable<Transfer[]> {
    return this.transfersSubject.asObservable();
  }

  getTransferById(id: string): Observable<Transfer | undefined> {
    return this.getTransfers().pipe(
      map(transfers => transfers.find(t => t.id === id))
    );
  }

  simulateTransfer(transfer: Omit<Transfer, 'id' | 'date' | 'status'>): Observable<boolean> {
    return new Observable(observer => {
      // Simulate API call delay
      setTimeout(() => {
        try {
          const newTransfer: Transfer = {
            ...transfer,
            id: this.generateId(),
            date: new Date(),
            status: 'completed'
          };

          const currentTransfers = this.getStoredTransfers();
          const updatedTransfers = [newTransfer, ...currentTransfers];
          this.storeTransfers(updatedTransfers);
          this.transfersSubject.next(updatedTransfers);

          observer.next(true);
          observer.complete();
        } catch (error) {
          observer.next(false);
          observer.complete();
        }
      }, 1000);
    });
  }

  getDashboardStats(): Observable<DashboardStats> {
  return this.getTransfers().pipe(
    map(transfers => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayTransfers = transfers.filter(t => {
        const transferDate = new Date(t.date);
        transferDate.setHours(0, 0, 0, 0);
        return transferDate.getTime() === today.getTime();
      });

      const totalTransactions = todayTransfers.length;
      const totalAmount = todayTransfers.reduce((sum, t) => sum + t.amount, 0);
      const averageTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

      // Calcular total por moneda
      const totalAmountByCurrency: { [key: string]: number } = {};
      todayTransfers.forEach(transfer => {
        const currency = transfer.fromAccount.currency;
        if (!totalAmountByCurrency[currency]) {
          totalAmountByCurrency[currency] = 0;
        }
        totalAmountByCurrency[currency] += transfer.amount;
      });

      // Find account with most transactions
      const accountTransactions: { [key: string]: number } = {};
      todayTransfers.forEach(t => {
        accountTransactions[t.fromAccount.id] = (accountTransactions[t.fromAccount.id] || 0) + 1;
      });

      let accountWithMostTransactions = 'N/A';
      let maxTransactions = 0;
      for (const accountId in accountTransactions) {
        if (accountTransactions[accountId] > maxTransactions) {
          maxTransactions = accountTransactions[accountId];
          accountWithMostTransactions = accountId;
        }
      }

      return {
        totalTransactions,
        totalAmount,
        accountWithMostTransactions,
        averageTransaction,
        totalAmountByCurrency // Incluir la propiedad
      };
    })
  );
}

  filterTransfers(filters: { accountId?: string; minAmount?: number; maxAmount?: number }): Observable<Transfer[]> {
    return this.getTransfers().pipe(
      map(transfers => {
        return transfers.filter(transfer => {
          let matches = true;
          
          if (filters.accountId) {
            matches = matches && 
              (transfer.fromAccount.id === filters.accountId || 
               transfer.toAccount.id === filters.accountId);
          }
          
          if (filters.minAmount !== undefined) {
            matches = matches && transfer.amount >= filters.minAmount;
          }
          
          if (filters.maxAmount !== undefined) {
            matches = matches && transfer.amount <= filters.maxAmount;
          }
          
          return matches;
        });
      })
    );
  }

  private getStoredTransfers(): Transfer[] {
    try {
      const stored = localStorage.getItem(this.transfersKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private storeTransfers(transfers: Transfer[]): void {
    localStorage.setItem(this.transfersKey, JSON.stringify(transfers));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  getExchangeRate(fromCurrency: string, toCurrency: string): number {
  // Simular tasas de cambio (en una app real, esto vendría de una API)
  const rates: { [key: string]: number } = {
    'USD_EUR': 0.85,
    'EUR_USD': 1.18
  };
  
  const key = `${fromCurrency}_${toCurrency}`;
  return rates[key] || 1; // Retorna 1 si no hay tasa de cambio (misma moneda)
}
}