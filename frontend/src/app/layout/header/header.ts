import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { Button } from 'primeng/button';
import { AppConfig } from '../../services/app-config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Menu, Button],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  private configService = inject(AppConfig);
  private authService = inject(AuthService);
  
  protected appName = this.configService.appName;
  protected isAuthenticated = this.authService.isAuthenticatedSignal;
  
  items: MenuItem[] | undefined;

  ngOnInit() {
    this.items = [
      {
        label: '總覽看板',
        icon: 'pi pi-chart-bar',
        routerLink: '/dashboard',
      },
      {
        label: '交易明細',
        icon: 'pi pi-list',
        routerLink: '/transactions',
      },
      {
        label: 'AI 趨勢分析',
        icon: 'pi pi-chart-line',
        routerLink: '/analysis',
      },
      {
        label: 'AI 智慧搜尋',
        icon: 'pi pi-search',
        routerLink: '/smart-search',
      },
    ];
  }

  logout() {
    this.authService.logout();
  }
}
