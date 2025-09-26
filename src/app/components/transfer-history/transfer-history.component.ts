import { Component, OnInit, ViewChild } from '@angular/core';
import { TransferService } from '../../services/transfer.service';
import { AccountService } from '../../services/account.service';
import { Transfer, Account } from '../../models/account.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-transfer-history',
  templateUrl: './transfer-history.component.html',
  styleUrls: ['./transfer-history.component.scss']
})
export class TransferHistoryComponent implements OnInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  transfers: Transfer[] = [];
  accounts: Account[] = [];
  dataSource = new MatTableDataSource<Transfer>();
  filterForm: FormGroup;
  
  displayedColumns: string[] = ['date', 'fromAccount', 'toAccount', 'amount', 'status'];
  isLoading = true;

  constructor(
    private transferService: TransferService,
    private accountService: AccountService,
    private fb: FormBuilder,
    private translate: TranslateService
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.loadTransfers();
    this.loadAccounts();
    this.setupFilterListeners();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      accountId: [''],
      minAmount: [''],
      maxAmount: ['']
    });
  }

  private loadTransfers(): void {
    this.transferService.getTransfers().subscribe(transfers => {
      this.transfers = transfers;
      this.dataSource.data = transfers;
      this.isLoading = false;
    });
  }

  private loadAccounts(): void {
    this.accountService.getAccounts().subscribe(accounts => {
      this.accounts = accounts;
    });
  }

  private setupFilterListeners(): void {
    this.filterForm.valueChanges.subscribe(filters => {
      this.applyFilters(filters);
    });
  }

  private applyFilters(filters: any): void {
    this.transferService.filterTransfers(filters).subscribe(filteredTransfers => {
      this.dataSource.data = filteredTransfers;
    });
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.dataSource.data = this.transfers;
  }

  getAccountName(accountId: string): string {
    const account = this.accounts.find(acc => acc.id === accountId);
    return account ? account.name : accountId;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'primary';
      case 'pending': return 'accent';
      case 'failed': return 'warn';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    return this.translate.instant(`TRANSFER.STATUS.${status.toUpperCase()}`);
  }
}