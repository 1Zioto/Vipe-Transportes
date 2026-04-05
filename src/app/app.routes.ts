import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'embarques',
    loadComponent: () => import('./pages/embarques/embarques.component').then(m => m.EmbarquesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tarefas',
    loadComponent: () => import('./pages/tarefas/tarefas.component').then(m => m.TarefasComponent),
    canActivate: [authGuard]
  },
  {
    path: 'ctes',
    loadComponent: () => import('./pages/ctes/ctes.component').then(m => m.CtesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent),
    canActivate: [authGuard]
  },
  {
    path: 'frota',
    loadComponent: () => import('./pages/frota/frota.component').then(m => m.FrotaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'mapa',
    loadComponent: () => import('./pages/mapa/mapa.component').then(m => m.MapaComponent),
    canActivate: [authGuard]
  },
  {
    path: 'relatorios',
    loadComponent: () => import('./pages/relatorios/relatorios.component').then(m => m.RelatoriosComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'dashboard' }
];
