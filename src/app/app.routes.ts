import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

import { LoginComponent } from './components/login/login.component';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ItemListComponent } from './components/item-list/item-list.component';
import { FuncionarioListComponent } from './components/funcionario-list/funcionario-list.component';
import { HistoricoCompletoComponent } from './components/historico-completo/historico-completo.component';
import { CadastroComponent } from './components/cadastro/cadastro.component';

const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isAuthenticated()) {
    return true; 
  }
  return router.parseUrl('/login');
};

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent 
  },

  { 
    path: 'cadastro', 
    component: CadastroComponent 
  },
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [authGuard], 
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'itens', component: ItemListComponent },
      { path: 'funcionarios', component: FuncionarioListComponent },
      { path: 'historico', component: HistoricoCompletoComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  { path: '', redirectTo: '/app', pathMatch: 'full' },
  { path: '**', redirectTo: '/app' }
];
