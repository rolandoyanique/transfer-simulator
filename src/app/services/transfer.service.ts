import { Injectable } from '@angular/core';
import { Transfer, DashboardStats, WeeklySummary, PerformanceMetrics, ReportFilter } from '../models/account.model';
import { BehaviorSubject, Observable, of, combineLatest } from 'rxjs';
import { map, tap, distinctUntilChanged, debounceTime } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TransferService {
  private transfersKey = 'bank-transfers';
  private transfersSubject = new BehaviorSubject<Transfer[]>(this.getStoredTransfers());
  private reportFiltersSubject = new BehaviorSubject<ReportFilter>({});
  private autoRefreshSubject = new BehaviorSubject<boolean>(true);
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
  setReportFilters(filters: ReportFilter): void {
    this.reportFiltersSubject.next(filters);
  }
  getDynamicDashboardStats(): Observable<DashboardStats> {
    return combineLatest([
      this.getTransfers(),
      this.reportFiltersSubject,
      this.autoRefreshSubject
    ]).pipe(
      debounceTime(300), // Evitar actualizaciones muy frecuentes
      map(([transfers, filters, autoRefresh]) => {
        const filteredTransfers = this.applyFilters(transfers, filters);
        return this.calculateDashboardStats(filteredTransfers);
      }),
      distinctUntilChanged((prev, curr) => 
        JSON.stringify(prev) === JSON.stringify(curr)
      )
    );
  }
  private calculateDashboardStats(transfers: Transfer[]): DashboardStats {
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

    const last30Days = this.getLastNDays(30);
    const last30DaysTransfers = transfers.filter(t => {
      const transferDate = new Date(t.date);
      transferDate.setHours(0, 0, 0, 0);
      return last30Days.some(day => day.getTime() === transferDate.getTime());
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

    // Resumen semanal
    const weeklySummary = this.calculateWeeklySummary(transfers);

    // Métricas de performance
    const performanceMetrics = this.calculatePerformanceMetrics(transfers);

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
      dailyTrend,
      weeklySummary,
      performanceMetrics
    };
  }
  private calculateWeeklySummary(transfers: Transfer[]): WeeklySummary {
    const currentWeek = this.getCurrentWeek();
    const previousWeek = this.getPreviousWeek();
    
    const currentWeekTransfers = transfers.filter(t => {
      const transferDate = new Date(t.date);
      return transferDate >= currentWeek.start && transferDate <= currentWeek.end;
    });

    const previousWeekTransfers = transfers.filter(t => {
      const transferDate = new Date(t.date);
      return transferDate >= previousWeek.start && transferDate <= previousWeek.end;
    });

    const totalTransactions = currentWeekTransfers.length;
    const totalAmount = currentWeekTransfers.reduce((sum, t) => sum + t.amount, 0);
    
    const previousWeekAmount = previousWeekTransfers.reduce((sum, t) => sum + t.amount, 0);
    const comparisonWithPreviousWeek = previousWeekAmount > 0 ? 
      ((totalAmount - previousWeekAmount) / previousWeekAmount) * 100 : 0;

    // Encontrar cuenta con mejor rendimiento
    const accountPerformance: { [key: string]: number } = {};
    currentWeekTransfers.forEach(t => {
      accountPerformance[t.fromAccount.id] = (accountPerformance[t.fromAccount.id] || 0) + t.amount;
    });

    let topPerformingAccount = 'N/A';
    let maxAmount = 0;
    for (const accountId in accountPerformance) {
      if (accountPerformance[accountId] > maxAmount) {
        maxAmount = accountPerformance[accountId];
        topPerformingAccount = accountId;
      }
    }

    return {
      weekNumber: this.getWeekNumber(new Date()),
      totalTransactions,
      totalAmount,
      comparisonWithPreviousWeek,
      topPerformingAccount
    };
  }
  private calculatePerformanceMetrics(transfers: Transfer[]): PerformanceMetrics {
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    
    const recentTransfers = transfers.filter(t => new Date(t.date) >= last24Hours);
    
    const transactionVelocity = recentTransfers.length / 24; // transacciones por hora
    
    const averageTransferSize = recentTransfers.length > 0 ? 
      recentTransfers.reduce((sum, t) => sum + t.amount, 0) / recentTransfers.length : 0;

    // Horas pico de actividad
    const hourCounts = Array(24).fill(0);
    recentTransfers.forEach(t => {
      const hour = new Date(t.date).getHours();
      hourCounts[hour]++;
    });

    const maxCount = Math.max(...hourCounts);
    const peakActivityHours = hourCounts
      .map((count, hour) => ({ count, hour }))
      .filter(item => item.count === maxCount)
      .map(item => `${item.hour}:00`);

    const successRate = 95; // Porcentaje simulado de transacciones exitosas

    return {
      transactionVelocity,
      averageTransferSize,
      peakActivityHours,
      successRate
    };
  }

  private getCurrentWeek(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  private getPreviousWeek(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() - 7);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private getLastNDays(n: number): Date[] {
    const days: Date[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }
    return days;
  }
  private applyFilters(transfers: Transfer[], filters: ReportFilter): Transfer[] {
    let filtered = transfers;

    // Filtro por rango de fechas
    if (filters.dateRange) {
      filtered = filtered.filter(transfer => {
        const transferDate = new Date(transfer.date);
        return transferDate >= filters.dateRange!.start && 
               transferDate <= filters.dateRange!.end;
      });
    }

    // Filtro por cuentas
    if (filters.accounts && filters.accounts.length > 0) {
      filtered = filtered.filter(transfer =>
        filters.accounts!.includes(transfer.fromAccount.id) ||
        filters.accounts!.includes(transfer.toAccount.id)
      );
    }

    // Filtro por monto
    if (filters.minAmount !== undefined) {
      filtered = filtered.filter(transfer => transfer.amount >= filters.minAmount!);
    }

    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter(transfer => transfer.amount <= filters.maxAmount!);
    }

    // Filtro por tipo de transacción
    if (filters.transactionType === 'incoming') {
      filtered = filtered.filter(transfer => transfer.toAccount.id === 'current-user'); // Asumiendo ID de usuario actual
    } else if (filters.transactionType === 'outgoing') {
      filtered = filtered.filter(transfer => transfer.fromAccount.id === 'current-user');
    }

    return filtered;
  }
  getRealTimeUpdates(): Observable<Transfer> {
    return new Observable(observer => {
      const subscription = this.getTransfers().subscribe(transfers => {
        if (transfers.length > 0) {
          // Emitir la transferencia más reciente
          const latestTransfer = transfers[0];
          observer.next(latestTransfer);
        }
      });

      return () => subscription.unsubscribe();
    });
  }
  setAutoRefresh(enabled: boolean): void {
    this.autoRefreshSubject.next(enabled);
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

        // CALCULAR LAS PROPIEDADES FALTANTES
        const weeklySummary = this.calculateWeeklySummary(transfers);
        const performanceMetrics = this.calculatePerformanceMetrics(transfers);

        return {
          totalTransactions,
          totalAmount,
          accountWithMostTransactions,
          averageTransaction,
          totalAmountByCurrency,
          transactionsByHour,
          transactionsByAccount,
          amountByAccount,
          dailyTrend,
          weeklySummary, // Agregado
          performanceMetrics // Agregado
        };
      })
    );
  }

  filterTransfers(filters: { 
  fromAccount?: string; 
  toAccount?: string; 
  minAmount?: number; 
  maxAmount?: number;
  dateRange?: { start: Date; end: Date };
}): Observable<Transfer[]> {
  return this.getTransfers().pipe(
    map(transfers => {
      return transfers.filter(transfer => {
        let matches = true;
        
        // Filtro por cuenta origen
        if (filters.fromAccount && filters.fromAccount !== '') {
          matches = matches && transfer.fromAccount.id === filters.fromAccount;
        }
        
        // Filtro por cuenta destino
        if (filters.toAccount && filters.toAccount !== '') {
          matches = matches && transfer.toAccount.id === filters.toAccount;
        }
        
        // Filtro por monto mínimo
        if (filters.minAmount !== undefined && filters.minAmount !== null) {
          matches = matches && transfer.amount >= filters.minAmount;
        }
        
        // Filtro por monto máximo
        if (filters.maxAmount !== undefined && filters.maxAmount !== null) {
          matches = matches && transfer.amount <= filters.maxAmount;
        }
        
        // Filtro por rango de fechas
        if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
          const transferDate = new Date(transfer.date);
          matches = matches && 
                    transferDate >= filters.dateRange.start && 
                    transferDate <= filters.dateRange.end;
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