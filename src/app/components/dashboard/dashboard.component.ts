import { Component, OnInit,OnDestroy, ViewChild } from '@angular/core';
import { TransferService } from '../../services/transfer.service';
import { DashboardStats, ChartData,Transfer } from '../../models/account.model';
import { TranslateService } from '@ngx-translate/core';
import { AccountService } from '../../services/account.service';
import { Account } from '../../models/account.model';
import { ChartConfiguration, ChartType, ChartData as ChartJsData, ChartEvent } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Subscription } from 'rxjs';
import { PrintService } from '../../services/print.service';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  stats: DashboardStats = {
    totalTransactions: 0,
    totalAmount: 0,
    accountWithMostTransactions: 'N/A',
    averageTransaction: 0,
    totalAmountByCurrency: {},
    transactionsByHour: [],
    transactionsByAccount: [],
    amountByAccount: [],
    dailyTrend: [],
    weeklySummary: {
      weekNumber: 0,
      totalTransactions: 0,
      totalAmount: 0,
      comparisonWithPreviousWeek: 0,
      topPerformingAccount: 'N/A'
    },
    performanceMetrics: {
      transactionVelocity: 0,
      averageTransferSize: 0,
      peakActivityHours: [],
      successRate: 0
    }
  };
  
  accounts: Account[] = [];
  isLoading = true;
  lastUpdate = new Date();
  realTimeUpdates = false;
  private statsSubscription: Subscription | undefined;
  private realTimeSubscription: Subscription | undefined;
  // Configuración de gráficas
  public hourlyChartData: ChartJsData<'bar'> = {
    labels: [],
    datasets: []
  };

  public accountChartData: ChartJsData<'doughnut'> = {
    labels: [],
    datasets: []
  };

  public trendChartData: ChartJsData<'line'> = {
    labels: [],
    datasets: []
  };

  public amountChartData: ChartJsData<'bar'> = {
    labels: [],
    datasets: []
  };

  public hourlyChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: 'Transacciones por Hora'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Hora del día'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de transacciones'
        }
      }
    }
  };

  public accountChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'right'
      },
      title: {
        display: true,
        text: 'Transacciones por Cuenta'
      }
    }
  };

  public trendChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: 'Tendencia de Transacciones (7 días)'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Fecha'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de transacciones'
        }
      }
    }
  };

  public amountChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: 'Monto Transferido por Cuenta'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Cuenta'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Monto (USD)'
        }
      }
    }
  };

  public hourlyChartType: ChartType = 'bar';
  public accountChartType: ChartType = 'doughnut';
  public trendChartType: ChartType = 'line';
  public amountChartType: ChartType = 'bar';

  constructor(
    private transferService: TransferService,
    private accountService: AccountService,
    private translate: TranslateService,
    private printService: PrintService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadAccounts();
    this.startRealTimeUpdates();
  }
ngOnDestroy(): void {
    if (this.statsSubscription) {
      this.statsSubscription.unsubscribe();
    }
    if (this.realTimeSubscription) {
      this.realTimeSubscription.unsubscribe();
    }
  }
  private loadDynamicStats(): void {
    this.statsSubscription = this.transferService.getDynamicDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
        this.lastUpdate = new Date();
        this.updateCharts();
      },
      error: (error) => {
        console.error('Error loading dynamic stats:', error);
        this.isLoading = false;
      }
    });
  }
  private startRealTimeUpdates(): void {
    this.realTimeSubscription = this.transferService.getRealTimeUpdates().subscribe({
      next: (transfer) => {
        if (this.realTimeUpdates) {
          // Forzar actualización de estadísticas cuando llega una nueva transferencia
          this.loadDynamicStats();
        }
      }
    });
  }
  toggleRealTimeUpdates(): void {
    this.realTimeUpdates = !this.realTimeUpdates;
  }
  getWeeklyComparisonClass(): string {
    return this.stats.weeklySummary.comparisonWithPreviousWeek >= 0 ? 'positive' : 'negative';
  }

  getWeeklyComparisonIcon(): string {
    return this.stats.weeklySummary.comparisonWithPreviousWeek >= 0 ? 'trending_up' : 'trending_down';
  }

  formatComparison(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  refreshManually(): void {
    this.isLoading = true;
    this.loadDynamicStats();
  }
  private loadDashboardData(): void {
    this.transferService.getDashboardStats().subscribe(stats => {
      this.stats = stats;
      this.isLoading = false;
      this.updateCharts();
    });
  }

  private loadAccounts(): void {
    this.accountService.getAccounts().subscribe(accounts => {
      this.accounts = accounts;
    });
  }

  private updateCharts(): void {
    this.updateHourlyChart();
    this.updateAccountChart();
    this.updateTrendChart();
    this.updateAmountChart();
  }

  private updateHourlyChart(): void {
    const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
    
    this.hourlyChartData = {
      labels: hours,
      datasets: [
        {
          data: this.stats.transactionsByHour,
          label: 'Transacciones',
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };
  }

  private updateAccountChart(): void {
    const topAccounts = this.stats.transactionsByAccount.slice(0, 5);
    
    this.accountChartData = {
      labels: topAccounts.map(item => item.accountName),
      datasets: [
        {
          data: topAccounts.map(item => item.count),
          label: 'Transacciones',
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  }

  private updateTrendChart(): void {
    this.trendChartData = {
      labels: this.stats.dailyTrend.map(item => item.date),
      datasets: [
        {
          data: this.stats.dailyTrend.map(item => item.transactions),
          label: 'Transacciones',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          data: this.stats.dailyTrend.map(item => item.amount / 1000), // Escalar para mejor visualización
          label: 'Monto (miles USD)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    };
  }

  private updateAmountChart(): void {
    const topAmounts = this.stats.amountByAccount.slice(0, 6);
    
    this.amountChartData = {
      labels: topAmounts.map(item => this.shortenName(item.accountName)),
      datasets: [
        {
          data: topAmounts.map(item => item.amount),
          label: 'Monto Transferido',
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1
        }
      ]
    };
  }

  private shortenName(fullName: string): string {
    const names = fullName.split(' ');
    return names.length > 1 ? `${names[0]} ${names[1].charAt(0)}.` : fullName;
  }

  getAccountName(accountId: string): string {
    const account = this.accounts.find(acc => acc.id === accountId);
    return account ? account.name : accountId;
  }

  getCurrencies(): string[] {
    return Object.keys(this.stats.totalAmountByCurrency || {});
  }

  formatCurrencyAmount(currency: string): string {
    const amount = this.stats.totalAmountByCurrency[currency];
    const symbol = currency === 'USD' ? '$' : '€';
    return `${symbol} ${amount.toFixed(2)}`;
  }

  // Eventos de las gráficas
  chartClicked({ event, active }: { event?: ChartEvent, active?: any[] }): void {
    console.log('Chart clicked:', event, active);
  }

  chartHovered({ event, active }: { event?: ChartEvent, active?: any[] }): void {
    console.log('Chart hovered:', event, active);
  }
  public realTimeChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: 'Tendencia de Transacciones - Últimas 24 Horas',
        font: {
          size: 16
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 12
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Hora del Día',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        display: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de Transacciones',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          stepSize: 1
        }
      }
    },
    elements: {
      line: {
        tension: 0.4, // Suaviza la línea
        borderWidth: 3
      },
      point: {
        radius: 5,
        hoverRadius: 8,
        backgroundColor: '#3f51b5'
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };
  printDashboardReport(): void {
    this.printService.printDashboardReport(this.stats, 'Reporte del Dashboard');
  }

  printPerformanceReport(): void {
    const title = `Reporte de Rendimiento - ${new Date().toLocaleDateString('es-ES')}`;
    this.printService.printDashboardReport(this.stats, title);
  }
}