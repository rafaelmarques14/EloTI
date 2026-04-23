import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private isLoggedIn$ = new BehaviorSubject<boolean>(this.hasToken());

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  private hasToken(): boolean {
    return !!localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn$.value;
  }

  login(user: string, password: string): Observable<boolean> {

    localStorage.setItem('authToken', 'fake-token-bypassed');
    
    this.isLoggedIn$.next(true);

    return of(true);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.isLoggedIn$.next(false);
    this.router.navigate(['/login']);
  }
}
