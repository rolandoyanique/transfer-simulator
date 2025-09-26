import { Injectable } from '@angular/core';
import { Account } from '../models/account.model';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private accountsUrl = 'assets/data/accounts.json';

  constructor(private http: HttpClient) { }

  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.accountsUrl).pipe(
      catchError(() => {
        // Fallback data if the file doesn't exist
        return of(this.getDefaultAccounts());
      })
    );
  }

  getAccountById(id: string): Observable<Account | undefined> {
    return this.getAccounts().pipe(
      map(accounts => accounts.find(account => account.id === id))
    );
  }

  private getDefaultAccounts(): Account[] {
    return [
      {
        id: '1',
        type: 'Cuenta Corriente',
        name: 'Juan Pérez',
        balance: 15000,
        currency: 'USD',
        photo: 'https://randomuser.me/api/portraits/men/1.jpg',
        accountNumber: '001-1234567'
      },
      {
        id: '2',
        type: 'Cuenta Ahorros',
        name: 'María García',
        balance: 25000,
        currency: 'USD',
        photo: 'https://randomuser.me/api/portraits/women/1.jpg',
        accountNumber: '001-1234568'
      },
      {
        id: '3',
        type: 'Cuenta Corriente',
        name: 'Carlos López',
        balance: 18000,
        currency: 'USD',
        photo: 'https://randomuser.me/api/portraits/men/2.jpg',
        accountNumber: '001-1234569'
      },
      {
        id: '4',
        type: 'Cuenta Ahorros',
        name: 'Ana Martínez',
        balance: 32000,
        currency: 'USD',
        photo: 'https://randomuser.me/api/portraits/women/2.jpg',
        accountNumber: '001-1234570'
      }
    ];
  }
}