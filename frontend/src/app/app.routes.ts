import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Dashboard } from './pages/dashboard/dashboard';
import { TransactionList } from './pages/transaction-list/transaction-list';
import { Analysis } from './pages/analysis/analysis';
import { SmartSearch } from './pages/smart-search/smart-search';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', component: Home }, // Or redirect to dashboard: redirectTo: 'dashboard', pathMatch: 'full'
      { path: 'dashboard', component: Dashboard },
      { path: 'transactions', component: TransactionList },
      { path: 'analysis', component: Analysis },
      { path: 'smart-search', component: SmartSearch },
    ]
  },
  { path: '**', redirectTo: '' }
];
