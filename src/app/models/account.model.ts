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

export interface DashboardStats {
  totalTransactions: number;
  totalAmount: number;
  accountWithMostTransactions: string;
  averageTransaction: number;
  totalAmountByCurrency: { [key: string]: number };
  
  // Nuevas propiedades para gráficas
  transactionsByHour: number[];
  transactionsByAccount: { accountName: string; count: number }[];
  amountByAccount: { accountName: string; amount: number }[];
  dailyTrend: { date: string; transactions: number; amount: number }[];
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