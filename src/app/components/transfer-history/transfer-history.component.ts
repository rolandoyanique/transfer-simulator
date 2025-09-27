import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { TransferService } from '../../services/transfer.service';
import { AccountService } from '../../services/account.service';
import { Transfer, Account } from '../../models/account.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { PrintService } from '../../services/print.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-transfer-history',
  templateUrl: './transfer-history.component.html',
  styleUrls: ['./transfer-history.component.scss']
})
export class TransferHistoryComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  transfers: Transfer[] = [];
  filteredTransfers: Transfer[] = [];
  accounts: Account[] = [];
  dataSource = new MatTableDataSource<Transfer>();
  filterForm: FormGroup;
  
  displayedColumns: string[] = ['date', 'fromAccount', 'toAccount', 'amount', 'status', 'actions'];
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private transferService: TransferService,
    private accountService: AccountService,
    private fb: FormBuilder,
    private translate: TranslateService,
    private printService: PrintService
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
    
    // Configurar el sorting para que funcione con objetos anidados
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'fromAccount': return item.fromAccount.name;
        case 'toAccount': return item.toAccount.name;
        case 'date': return new Date(item.date).getTime();
        case 'amount': return item.amount;
        case 'status': return item.status;
        default: return (item as any)[property];
      }
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      fromAccount: [''],
      toAccount: [''],
      minAmount: [null],
      maxAmount: [null],
      startDate: [null],
      endDate: [null],
      searchText: ['']
    });
  }

  private loadTransfers(): void {
    this.transferService.getTransfers().subscribe(transfers => {
      this.transfers = transfers;
      this.filteredTransfers = [...transfers];
      this.dataSource.data = this.filteredTransfers;
      this.isLoading = false;
      this.applyFilters(); // Aplicar filtros iniciales si existen
    });
  }

  private loadAccounts(): void {
    this.accountService.getAccounts().subscribe(accounts => {
      this.accounts = accounts;
    });
  }

  private setupFilterListeners(): void {
    // Debounce para búsqueda de texto
    this.filterForm.get('searchText')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.applyFilters();
      });

    // Listeners para los demás filtros
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  private applyFilters(): void {
    const filters = this.filterForm.value;
    
    this.transferService.filterTransfers({
      fromAccount: filters.fromAccount,
      toAccount: filters.toAccount,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
      dateRange: filters.startDate && filters.endDate ? {
        start: new Date(filters.startDate),
        end: new Date(filters.endDate)
      } : undefined
    }).subscribe(filteredTransfers => {
      // Aplicar filtro de texto adicional si existe
      let result = filteredTransfers;
      
      if (filters.searchText) {
        const searchText = filters.searchText.toLowerCase();
        result = result.filter(transfer => 
          transfer.fromAccount.name.toLowerCase().includes(searchText) ||
          transfer.toAccount.name.toLowerCase().includes(searchText) ||
          transfer.fromAccount.accountNumber.includes(searchText) ||
          transfer.toAccount.accountNumber.includes(searchText) ||
          transfer.description?.toLowerCase().includes(searchText) ||
          transfer.amount.toString().includes(searchText)
        );
      }
      
      this.filteredTransfers = result;
      this.dataSource.data = this.filteredTransfers;
    });
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      fromAccount: '',
      toAccount: '',
      minAmount: null,
      maxAmount: null,
      startDate: null,
      endDate: null,
      searchText: ''
    });
  }

  clearDateFilter(): void {
    this.filterForm.patchValue({
      startDate: null,
      endDate: null
    });
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

  printReport(): void {
    const filteredTransfers = this.dataSource.filteredData;
    if (filteredTransfers.length === 0) {
      this.notifyNoData();
      return;
    }

    const title = `Reporte de Transferencias - ${new Date().toLocaleDateString('es-ES')}`;
    this.printService.printTransferReport(filteredTransfers, title);
  }

  printAllReport(): void {
    if (this.transfers.length === 0) {
      this.notifyNoData();
      return;
    }

    const title = `Reporte Completo de Transferencias - ${new Date().toLocaleDateString('es-ES')}`;
    this.printService.printTransferReport(this.transfers, title);
  }

  printTransferDetail(transfer: Transfer): void {
    this.printService.printTransferReport([transfer], `Detalle de Transferencia - ${transfer.id}`);
  }

  exportToPDF(): void {
    const transfersToExport = this.dataSource.filteredData.length > 0 ? 
                             this.dataSource.filteredData : this.transfers;
    
    if (transfersToExport.length === 0) {
      this.notifyNoData();
      return;
    }

    // Por ahora usamos la misma funcionalidad de impresión
    const title = `Exportación PDF - ${new Date().toLocaleDateString('es-ES')}`;
    this.printService.printTransferReport(transfersToExport, title);
  }

  private notifyNoData(): void {
    alert(this.translate.instant('TRANSFER.HISTORY.NO_DATA_TO_PRINT'));
  }

  // Método para formatear fechas en el filtro
  getMinEndDate(): Date | null {
    const startDate = this.filterForm.get('startDate')?.value;
    return startDate ? new Date(startDate) : null;
  }

  getMaxStartDate(): Date | null {
    const endDate = this.filterForm.get('endDate')?.value;
    return endDate ? new Date(endDate) : null;
  }
  getAmountColorClass(amount: number): string {
  if (amount > 1000) return 'amount-positive';
  if (amount < 100) return 'amount-negative';
  return 'amount-neutral';
}
}