import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TransferSimulationComponent } from './components/transfer-simulation/transfer-simulation.component';
import { TransferHistoryComponent } from './components/transfer-history/transfer-history.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'simulation', component: TransferSimulationComponent },
  { path: 'history', component: TransferHistoryComponent },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }