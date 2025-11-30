import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppConfig {
  readonly appName = signal('Ledger Lens');  
}
