import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TransferService } from '../../services/transfer.service';
import { ReportFilter } from '../../models/account.model';
import { AccountService } from '../../services/account.service';
import { Account } from '../../models/account.model';

@Component({
  selector: 'app-dynamic-filters',
  templateUrl: './dynamic-filters.component.html',
  styleUrls: ['./dynamic-filters.component.scss']
})
export class DynamicFiltersComponent implements OnInit {
  filterForm: FormGroup;
  accounts: Account[] = [];
  dateRanges = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: 'custom', label: 'Personalizado' }
  ];

  constructor(
    private fb: FormBuilder,
    private transferService: TransferService,
    private accountService: AccountService
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.setupFormListeners();
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      dateRange: ['today'],
      customStartDate: [null],
      customEndDate: [null],
      accounts: [[]],
      minAmount: [null],
      maxAmount: [null],
      transactionType: ['all'],
      autoRefresh: [true]
    });
  }

  private loadAccounts(): void {
    this.accountService.getAccounts().subscribe(accounts => {
      this.accounts = accounts;
    });
  }

  private setupFormListeners(): void {
    this.filterForm.valueChanges.subscribe(value => {
      const filters = this.buildFilters(value);
      this.transferService.setReportFilters(filters);
      this.transferService.setAutoRefresh(value.autoRefresh);
    });
  }

  private buildFilters(formValue: any): ReportFilter {
    const filters: ReportFilter = {};

    // Construir rango de fechas
    if (formValue.dateRange === 'custom' && formValue.customStartDate && formValue.customEndDate) {
      filters.dateRange = {
        start: new Date(formValue.customStartDate),
        end: new Date(formValue.customEndDate)
      };
    } else {
      filters.dateRange = this.getPredefinedDateRange(formValue.dateRange);
    }

    // Aplicar otros filtros
    if (formValue.accounts && formValue.accounts.length > 0) {
      filters.accounts = formValue.accounts;
    }

    if (formValue.minAmount) {
      filters.minAmount = formValue.minAmount;
    }

    if (formValue.maxAmount) {
      filters.maxAmount = formValue.maxAmount;
    }

    if (formValue.transactionType !== 'all') {
      filters.transactionType = formValue.transactionType;
    }

    return filters;
  }

  private getPredefinedDateRange(range: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (range) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      default:
        start.setDate(end.getDate() - 7); // Default a una semana
    }

    return { start, end };
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      dateRange: 'today',
      customStartDate: null,
      customEndDate: null,
      accounts: [],
      minAmount: null,
      maxAmount: null,
      transactionType: 'all'
    });
  }

  get showCustomDateRange(): boolean {
    return this.filterForm.get('dateRange')?.value === 'custom';
  }
}