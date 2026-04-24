import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider'; 

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatToolbarModule, MatIconModule,
    MatButtonModule, MatSidenavModule, MatListModule, MatDividerModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private authService = inject(AuthService);

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  navLinks = [
    { path: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: 'itens', label: 'Itens', icon: 'list_alt' },
    { path: 'funcionarios', label: 'Funcionários', icon: 'people' },
    { path: 'historico', label: 'Histórico', icon: 'history' }
  ];

  logout(): void {
    this.authService.logout();
  }
}
