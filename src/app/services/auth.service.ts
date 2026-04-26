import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private isLoggedIn$ = new BehaviorSubject<boolean>(this.hasToken());

  private readonly USERS_KEY = 'elo_ti_users';

  constructor(
    private http: HttpClient,
    private router: Router
  ) { 
    this.inicializarUsuariosBase();
  }

  private inicializarUsuariosBase(): void {
    if (!localStorage.getItem(this.USERS_KEY)) {
      const defaultUsers = [{ user: 'admin', password: '1234' }];
      localStorage.setItem(this.USERS_KEY, JSON.stringify(defaultUsers));
    }
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn$.value;
  }

  register(user: string, password: string): Observable<boolean> {
    const users = JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
    
    const userExists = users.some((u: any) => u.user === user);

    if (userExists) {
      return of(false); 
    }

    users.push({ user, password });
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    
    return of(true);
  }

 login(user: string, password: string): Observable<boolean> {
    const users = JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
    const validUser = users.find((u: any) => u.user === user && u.password === password);

    if (validUser) {
      localStorage.setItem('authToken', 'fake-token-bypassed');
      
      localStorage.setItem('currentUser', user); 
      
      this.isLoggedIn$.next(true);
      return of(true);
    }
    return of(false);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    
    localStorage.removeItem('currentUser');
    
    this.isLoggedIn$.next(false);
    this.router.navigate(['/login']);
  }
}
