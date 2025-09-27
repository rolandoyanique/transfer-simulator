import { Component, OnInit, ViewChild } from '@angular/core';
import { TransferService } from '../../services/transfer.service';
import { AccountService } from '../../services/account.service';
import { Transfer, Account, DashboardStats } from '../../models/account.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { PrintService } from '../../services/print.service';
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
  // printDashboardReport(): void {
  //   this.printService.printDashboardReport(this.stats, 'Reporte del Dashboard');
  // }

  // printPerformanceReport(): void {
  //   const title = `Reporte de Rendimiento - ${new Date().toLocaleDateString('es-ES')}`;
  //   this.printService.printDashboardReport(this.stats, title);
  // }
  printReport(): void {
    const filteredTransfers = this.dataSource.filteredData;
    if (filteredTransfers.length === 0) {
      alert('No hay datos para imprimir');
      return;
    }

    const title = `Reporte de Transferencias - ${new Date().toLocaleDateString('es-ES')}`;
    this.printService.printTransferReport(filteredTransfers, title);
  }
  printAllReport(): void {
    if (this.transfers.length === 0) {
      alert('No hay datos para imprimir');
      return;
    }

    const title = `Reporte Completo de Transferencias - ${new Date().toLocaleDateString('es-ES')}`;
    this.printService.printTransferReport(this.transfers, title);
  }

  exportToPDF(): void {
    // Esta función podría integrarse con una librería como jsPDF en el futuro
    alert('Exportación a PDF estará disponible próximamente');
  }
  printTransferDetail(transfer: Transfer): void {
  const printService = this.printService as any;
  if (printService.printTransferReport) {
    printService.printTransferReport([transfer], `Detalle de Transferencia - ${transfer.id}`);
  }
}
}