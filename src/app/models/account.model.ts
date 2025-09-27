export interface Account {
  id: string;
  type: string;
  name: string;
  balance: number;
  currency: string;
  photo: string;
  accountNumber: string;
  email?: string;
  phone?: string;
}

export interface Transfer {
  id: string;
  fromAccount: Account;
  toAccount: Account;
  amount: number;
  date: Date;
  status: 'completed' | 'failed' | 'pending';
  description?: string;
  exchangeRate?: number;
  convertedAmount?: number;
}



export interface PerformanceMetrics {
  transactionVelocity: number; // transacciones por hora
  averageTransferSize: number;
  peakActivityHours: string[];
  successRate: number;
}



export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor: string | string[];
  borderWidth?: number;
}
export interface DashboardStats {
  totalTransactions: number;
  totalAmount: number;
  accountWithMostTransactions: string;
  averageTransaction: number;
  totalAmountByCurrency: { [key: string]: number };
  
  // Nuevas propiedades para reportes dinámicos
  transactionsByHour: number[];
  transactionsByAccount: { accountName: string; count: number }[];
  amountByAccount: { accountName: string; amount: number }[];
  dailyTrend: { date: string; transactions: number; amount: number }[];
  weeklySummary: WeeklySummary;
  performanceMetrics: PerformanceMetrics;
}

export interface WeeklySummary {
  weekNumber: number;
  totalTransactions: number;
  totalAmount: number;
  comparisonWithPreviousWeek: number; // porcentaje
  topPerformingAccount: string;
}



export interface ReportFilter {
  dateRange?: { start: Date; end: Date };
  accounts?: string[];
  minAmount?: number;
  maxAmount?: number;
  transactionType?: 'all' | 'incoming' | 'outgoing';
}

export interface DynamicReport {
  id: string;
  title: string;
  type: 'chart' | 'table' | 'summary';
  data: any;
  filters: ReportFilter;
  lastUpdated: Date;
  autoRefresh: boolean;
}