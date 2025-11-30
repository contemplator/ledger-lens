import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Dashboard } from './pages/dashboard/dashboard';
import { TransactionList } from './pages/transaction-list/transaction-list';
import { Analysis } from './pages/analysis/analysis';
import { SmartSearch } from './pages/smart-search/smart-search';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'dashboard', component: Dashboard },
  { path: 'transactions', component: TransactionList },
  { path: 'analysis', component: Analysis },
  { path: 'smart-search', component: SmartSearch },
  { path: '**', redirectTo: '' }
];

