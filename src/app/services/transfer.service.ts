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

  // CORREGIDO: Cambiado de getTransfer() a getTransfers()
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
    return this.getTransfers().pipe( // CORREGIDO: Cambiado a getTransfers()
      map(transfers => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayTransfers = transfers.filter(t => {
          const transferDate = new Date(t.date);
          transferDate.setHours(0, 0, 0, 0);
          return transferDate.getTime() === today.getTime();
        });

        const last7Days = this.getLast7Days();
        const last7DaysTransfers = transfers.filter(t => {
          const transferDate = new Date(t.date);
          transferDate.setHours(0, 0, 0, 0);
          return last7Days.some(day => day.getTime() === transferDate.getTime());
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

        // Transacciones por hora (últimas 24 horas)
        const transactionsByHour = this.calculateTransactionsByHour(transfers);

        // Transacciones por cuenta
        const transactionsByAccount = this.calculateTransactionsByAccount(todayTransfers);

        // Monto por cuenta
        const amountByAccount = this.calculateAmountByAccount(todayTransfers);

        // Tendencia diaria (últimos 7 días)
        const dailyTrend = this.calculateDailyTrend(last7Days, last7DaysTransfers);

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
          totalAmountByCurrency,
          transactionsByHour,
          transactionsByAccount,
          amountByAccount,
          dailyTrend
        };
      })
    );
  }

  filterTransfers(filters: { accountId?: string; minAmount?: number; maxAmount?: number }): Observable<Transfer[]> {
    return this.getTransfers().pipe( // CORREGIDO: Cambiado a getTransfers()
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

  private getLast7Days(): Date[] {
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }
    return days;
  }

  private calculateTransactionsByHour(transfers: Transfer[]): number[] {
    const hours = Array(24).fill(0);
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    transfers.forEach(transfer => {
      if (new Date(transfer.date) >= last24Hours) {
        const hour = new Date(transfer.date).getHours();
        hours[hour]++;
      }
    });

    return hours;
  }

  private calculateTransactionsByAccount(transfers: Transfer[]): { accountName: string; count: number }[] {
    const accountMap: { [key: string]: number } = {};

    transfers.forEach(transfer => {
      const accountName = transfer.fromAccount.name;
      accountMap[accountName] = (accountMap[accountName] || 0) + 1;
    });

    return Object.keys(accountMap).map(accountName => ({
      accountName,
      count: accountMap[accountName]
    })).sort((a, b) => b.count - a.count);
  }

  private calculateAmountByAccount(transfers: Transfer[]): { accountName: string; amount: number }[] {
    const accountMap: { [key: string]: number } = {};

    transfers.forEach(transfer => {
      const accountName = transfer.fromAccount.name;
      accountMap[accountName] = (accountMap[accountName] || 0) + transfer.amount;
    });

    return Object.keys(accountMap).map(accountName => ({
      accountName,
      amount: accountMap[accountName]
    })).sort((a, b) => b.amount - a.amount);
  }

  private calculateDailyTrend(days: Date[], transfers: Transfer[]): { date: string; transactions: number; amount: number }[] {
    return days.map(day => {
      const dayTransfers = transfers.filter(t => {
        const transferDate = new Date(t.date);
        transferDate.setHours(0, 0, 0, 0);
        return transferDate.getTime() === day.getTime();
      });

      return {
        date: day.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' }),
        transactions: dayTransfers.length,
        amount: dayTransfers.reduce((sum, t) => sum + t.amount, 0)
      };
    });
  }
}