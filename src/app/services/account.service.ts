import { Injectable } from '@angular/core';
import { Account } from '../models/account.model';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private accountsKey = 'bank-accounts';
  private randomUserApi = 'https://randomuser.me/api/';

  constructor(private http: HttpClient) { }

  getAccounts(): Observable<Account[]> {
    // Primero intentar obtener cuentas del localStorage
    const storedAccounts = this.getStoredAccounts();
    if (storedAccounts.length > 0) {
      return of(storedAccounts);
    }

    // Si no hay cuentas almacenadas, generar nuevas desde la API
    return this.generateAccountsFromAPI();
  }

  getAccountById(id: string): Observable<Account | undefined> {
    return this.getAccounts().pipe(
      map(accounts => accounts.find(account => account.id === id))
    );
  }

  private generateAccountsFromAPI(): Observable<Account[]> {
    // Generar 8 usuarios (4 hombres y 4 mujeres) para tener variedad
    const requests = [];
    
    for (let i = 0; i < 8; i++) {
      requests.push(this.http.get(`${this.randomUserApi}?gender=${i % 2 === 0 ? 'male' : 'female'}`));
    }

    return forkJoin(requests).pipe(
      map((responses: any[]) => {
        const accounts: Account[] = responses.map((response, index) => {
          const user = response.results[0];
          return this.transformUserToAccount(user, index);
        });

        // Guardar las cuentas generadas en localStorage
        this.storeAccounts(accounts);
        return accounts;
      }),
      catchError(error => {
        console.error('Error fetching from RandomUser API, using fallback data', error);
        return of(this.getDefaultAccounts());
      })
    );
  }

  private transformUserToAccount(user: any, index: number): Account {
    const accountTypes = ['Cuenta Corriente', 'Cuenta Ahorros', 'Cuenta Nómina'];
    const currencies = ['USD', 'EUR'];
    
    return {
      id: (index + 1).toString(),
      type: accountTypes[Math.floor(Math.random() * accountTypes.length)],
      name: `${user.name.first} ${user.name.last}`,
      balance: Math.floor(Math.random() * 50000) + 1000, // Entre 1000 y 51000
      currency: currencies[Math.floor(Math.random() * currencies.length)],
      photo: user.picture.large, // Usar la foto grande de la API
      accountNumber: this.generateAccountNumber(index)
    };
  }

  private generateAccountNumber(index: number): string {
    const bankCode = '001';
    const accountSuffix = (1000000 + index).toString().slice(-7);
    return `${bankCode}-${accountSuffix}`;
  }

  refreshAccounts(): Observable<Account[]> {
    // Limpiar cuentas almacenadas y generar nuevas
    localStorage.removeItem(this.accountsKey);
    return this.generateAccountsFromAPI();
  }

  private getStoredAccounts(): Account[] {
    try {
      const stored = localStorage.getItem(this.accountsKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private storeAccounts(accounts: Account[]): void {
    localStorage.setItem(this.accountsKey, JSON.stringify(accounts));
  }

  private getDefaultAccounts(): Account[] {
    // Datos de respaldo en caso de error de la API
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
      },
      {
        id: '5',
        type: 'Cuenta Nómina',
        name: 'Roberto Silva',
        balance: 22000,
        currency: 'EUR',
        photo: 'https://randomuser.me/api/portraits/men/3.jpg',
        accountNumber: '001-1234571'
      },
      {
        id: '6',
        type: 'Cuenta Ahorros',
        name: 'Laura Rodríguez',
        balance: 41000,
        currency: 'USD',
        photo: 'https://randomuser.me/api/portraits/women/3.jpg',
        accountNumber: '001-1234572'
      },
      {
        id: '7',
        type: 'Cuenta Corriente',
        name: 'Miguel Ángel Cruz',
        balance: 12500,
        currency: 'EUR',
        photo: 'https://randomuser.me/api/portraits/men/4.jpg',
        accountNumber: '001-1234573'
      },
      {
        id: '8',
        type: 'Cuenta Nómina',
        name: 'Sofía Hernández',
        balance: 28000,
        currency: 'USD',
        photo: 'https://randomuser.me/api/portraits/women/4.jpg',
        accountNumber: '001-1234574'
      }
    ];
  }
}