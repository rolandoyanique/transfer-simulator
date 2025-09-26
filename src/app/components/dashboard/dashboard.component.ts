import { Component, OnInit } from '@angular/core';
import { TransferService } from '../../services/transfer.service';
import { DashboardStats } from '../../models/account.model';
import { TranslateService } from '@ngx-translate/core';
import { AccountService } from '../../services/account.service';
import { Account } from '../../models/account.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalTransactions: 0,
    totalAmount: 0,
    accountWithMostTransactions: 'N/A',
    averageTransaction: 0
  };
  
  accounts: Account[] = [];
  isLoading = true;

  constructor(
    private transferService: TransferService,
    private accountService: AccountService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadAccounts();
  }

  private loadDashboardData(): void {
    this.transferService.getDashboardStats().subscribe(stats => {
      this.stats = stats;
      this.isLoading = false;
    });
  }

  private loadAccounts(): void {
    this.accountService.getAccounts().subscribe(accounts => {
      this.accounts = accounts;
    });
  }

  getAccountName(accountId: string): string {
    const account = this.accounts.find(acc => acc.id === accountId);
    return account ? account.name : accountId;
  }
}