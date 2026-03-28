import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, Usuario } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = false;
  usuario: Usuario | null = null;
  badges = { embarques: 0, tarefas: 0, ctes: 0 };
  private sub?: Subscription;

  readonly avatarColors = ['#1e6ef0','#10d48e','#ff8c42','#a78bfa','#f472b6','#00d4ff'];

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    this.usuario = this.auth.usuarioLogado();
    this.loadBadges();
    this.sub = interval(30000).subscribe(() => this.loadBadges());
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  private loadBadges(): void {
    this.api.stats().subscribe(s => {
      this.badges.embarques = s.pendentes;
      this.badges.tarefas   = s.tarefas_urgentes;
      this.badges.ctes      = s.ctes_pendentes;
    });
  }

  toggleSidebar(): void { this.sidebarOpen = !this.sidebarOpen; }
  closeSidebar():  void { this.sidebarOpen = false; }

  sair(): void { this.auth.logout(); }

  get iniciais(): string {
    const n = this.usuario?.nome || 'U';
    return n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }

  get avatarColor(): string {
    const i = (this.usuario?.id || 0) % this.avatarColors.length;
    return this.avatarColors[i];
  }
}
