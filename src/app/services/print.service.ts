import { Injectable } from '@angular/core';
import { Transfer, DashboardStats } from '../models/account.model';

@Injectable({
  providedIn: 'root'
})
export class PrintService {

  constructor() { }

  printTransferReport(transfers: Transfer[], title: string = 'Reporte de Transferencias'): void {
    const printContent = this.generateTransferReportHTML(transfers, title);
    this.openPrintWindow(printContent, title);
  }

  printDashboardReport(stats: DashboardStats, title: string = 'Reporte del Dashboard'): void {
    const printContent = this.generateDashboardReportHTML(stats, title);
    this.openPrintWindow(printContent, title);
  }

  printAccountStatement(account: any, transfers: Transfer[], title: string = 'Estado de Cuenta'): void {
    const printContent = this.generateAccountStatementHTML(account, transfers, title);
    this.openPrintWindow(printContent, title);
  }

  private generateTransferReportHTML(transfers: Transfer[], title: string): string {
    const totalAmount = transfers.reduce((sum, transfer) => sum + transfer.amount, 0);
    const date = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
        }
        .print-header {
            text-align: center;
            border-bottom: 3px solid #3f51b5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .print-header h1 {
            color: #3f51b5;
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .print-header .subtitle {
            color: #666;
            font-size: 16px;
        }
        .summary {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
        }
        .summary-item {
            text-align: center;
            margin: 10px;
        }
        .summary-value {
            font-size: 24px;
            font-weight: bold;
            color: #3f51b5;
        }
        .summary-label {
            font-size: 14px;
            color: #666;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th {
            background-color: #3f51b5;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .status-completed {
            color: #4caf50;
            font-weight: bold;
        }
        .status-pending {
            color: #ff9800;
            font-weight: bold;
        }
        .status-failed {
            color: #f44336;
            font-weight: bold;
        }
        .print-footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .print-header { border-color: #000; }
            th { background-color: #000 !important; }
        }
    </style>
</head>
<body>
    <div class="print-header">
        <h1>${title}</h1>
        <div class="subtitle">Generado el ${date}</div>
    </div>

    <div class="summary">
        <div class="summary-item">
            <div class="summary-value">${transfers.length}</div>
            <div class="summary-label">Total de Transferencias</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">$${totalAmount.toFixed(2)}</div>
            <div class="summary-label">Monto Total</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">$${(totalAmount / transfers.length || 0).toFixed(2)}</div>
            <div class="summary-label">Promedio por Transferencia</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Fecha y Hora</th>
                <th>Cuenta Origen</th>
                <th>Cuenta Destino</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Descripción</th>
            </tr>
        </thead>
        <tbody>
            ${transfers.map(transfer => `
                <tr>
                    <td>${new Date(transfer.date).toLocaleString('es-ES')}</td>
                    <td>${transfer.fromAccount.name}<br><small>${transfer.fromAccount.accountNumber}</small></td>
                    <td>${transfer.toAccount.name}<br><small>${transfer.toAccount.accountNumber}</small></td>
                    <td><strong>$${transfer.amount.toFixed(2)}</strong></td>
                    <td class="status-${transfer.status}">${this.getStatusText(transfer.status)}</td>
                    <td>${transfer.description || 'N/A'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="print-footer">
        <p>Reporte generado por Simulador de Transferencias Bancarias</p>
        <p>Página 1 de 1</p>
    </div>
</body>
</html>`;
  }

  private generateDashboardReportHTML(stats: DashboardStats, title: string): string {
    const date = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
        }
        .print-header {
            text-align: center;
            border-bottom: 3px solid #3f51b5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .print-header h1 {
            color: #3f51b5;
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            background: #f9f9f9;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #3f51b5;
            margin: 10px 0;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
        }
        .section {
            margin: 30px 0;
        }
        .section-title {
            border-bottom: 2px solid #3f51b5;
            padding-bottom: 10px;
            margin-bottom: 15px;
            color: #3f51b5;
        }
        .currency-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        }
        .currency-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 5px;
        }
        .print-footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="print-header">
        <h1>${title}</h1>
        <div>Generado el ${date}</div>
    </div>

    <div class="dashboard-grid">
        <div class="stat-card">
            <div class="stat-value">${stats.totalTransactions}</div>
            <div class="stat-label">Transacciones Hoy</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">$${stats.totalAmount.toFixed(2)}</div>
            <div class="stat-label">Monto Total Hoy</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">$${stats.averageTransaction.toFixed(2)}</div>
            <div class="stat-label">Promedio por Transacción</div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Resumen por Moneda</h2>
        <div class="currency-grid">
            ${Object.entries(stats.totalAmountByCurrency).map(([currency, amount]) => `
                <div class="currency-item">
                    <span>${currency}:</span>
                    <strong>$${amount.toFixed(2)}</strong>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Métricas de Rendimiento</h2>
        <div class="currency-grid">
            <div class="currency-item">
                <span>Velocidad de Transacciones:</span>
                <strong>${stats.performanceMetrics.transactionVelocity.toFixed(1)}/hora</strong>
            </div>
            <div class="currency-item">
                <span>Tamaño Promedio:</span>
                <strong>$${stats.performanceMetrics.averageTransferSize.toFixed(2)}</strong>
            </div>
            <div class="currency-item">
                <span>Tasa de Éxito:</span>
                <strong>${stats.performanceMetrics.successRate}%</strong>
            </div>
        </div>
    </div>

    <div class="print-footer">
        <p>Reporte generado por Simulador de Transferencias Bancarias</p>
        <p>Página 1 de 1</p>
    </div>
</body>
</html>`;
  }

  private generateAccountStatementHTML(account: any, transfers: Transfer[], title: string): string {
    const accountTransfers = transfers.filter(t => 
        t.fromAccount.id === account.id || t.toAccount.id === account.id
    );
    const totalOutgoing = accountTransfers
        .filter(t => t.fromAccount.id === account.id)
        .reduce((sum, t) => sum + t.amount, 0);
    const totalIncoming = accountTransfers
        .filter(t => t.toAccount.id === account.id)
        .reduce((sum, t) => sum + t.amount, 0);

    const date = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
        }
        .print-header {
            text-align: center;
            border-bottom: 3px solid #3f51b5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .account-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .account-details {
            flex: 1;
            min-width: 300px;
        }
        .account-summary {
            flex: 1;
            min-width: 300px;
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th {
            background-color: #3f51b5;
            color: white;
            padding: 12px;
            text-align: left;
        }
        td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        .outgoing { color: #f44336; }
        .incoming { color: #4caf50; }
        .print-footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="print-header">
        <h1>${title}</h1>
        <div>Generado el ${date}</div>
    </div>

    <div class="account-info">
        <div class="account-details">
            <h3>Información de la Cuenta</h3>
            <p><strong>Titular:</strong> ${account.name}</p>
            <p><strong>Número de Cuenta:</strong> ${account.accountNumber}</p>
            <p><strong>Tipo:</strong> ${account.type}</p>
            <p><strong>Moneda:</strong> ${account.currency}</p>
            <p><strong>Saldo Actual:</strong> $${account.balance.toFixed(2)}</p>
        </div>
        <div class="account-summary">
            <h3>Resumen del Período</h3>
            <p><strong>Total Ingresos:</strong> <span class="incoming">+$${totalIncoming.toFixed(2)}</span></p>
            <p><strong>Total Egresos:</strong> <span class="outgoing">-$${totalOutgoing.toFixed(2)}</span></p>
            <p><strong>Saldo Neto:</strong> <strong>$${(totalIncoming - totalOutgoing).toFixed(2)}</strong></p>
            <p><strong>Número de Transacciones:</strong> ${accountTransfers.length}</p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Cuenta Contraparte</th>
                <th>Monto</th>
                <th>Saldo</th>
            </tr>
        </thead>
        <tbody>
            ${accountTransfers.map(transfer => {
                const isOutgoing = transfer.fromAccount.id === account.id;
                const counterparty = isOutgoing ? transfer.toAccount : transfer.fromAccount;
                const amount = isOutgoing ? -transfer.amount : transfer.amount;
                const balance = account.balance + (isOutgoing ? -transfer.amount : transfer.amount);
                
                return `
                <tr>
                    <td>${new Date(transfer.date).toLocaleDateString('es-ES')}</td>
                    <td>${transfer.description || 'Transferencia'}</td>
                    <td>${isOutgoing ? 'Egreso' : 'Ingreso'}</td>
                    <td>${counterparty.name} (${counterparty.accountNumber})</td>
                    <td class="${isOutgoing ? 'outgoing' : 'incoming'}">
                        ${isOutgoing ? '-' : '+'}$${transfer.amount.toFixed(2)}
                    </td>
                    <td>$${balance.toFixed(2)}</td>
                </tr>
                `;
            }).join('')}
        </tbody>
    </table>

    <div class="print-footer">
        <p>Estado de Cuenta generado por Simulador de Transferencias Bancarias</p>
        <p>Página 1 de 1</p>
    </div>
</body>
</html>`;
  }

  private openPrintWindow(content: string, title: string): void {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Por favor, permite las ventanas emergentes para imprimir.');
      return;
    }

    printWindow.document.write(content);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        // Opcional: cerrar la ventana después de imprimir
        // printWindow.close();
      }, 500);
    };
  }

  private getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'completed': 'Completada',
      'pending': 'Pendiente',
      'failed': 'Fallida'
    };
    return statusMap[status] || status;
  }
}