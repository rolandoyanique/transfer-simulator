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
}