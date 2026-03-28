import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService, Embarque, Tarefa, Stats } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LayoutComponent } from '../../components/layout/layout.component';
import { Subscription, interval, forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutComponent, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: Stats = { total:0, pendentes:0, em_transporte:0, entregues:0, tarefas_pendentes:0, tarefas_urgentes:0, ctes_pendentes:0 };
  embarquesRecentes: Embarque[] = [];
  tarefasUrgentes: Tarefa[] = [];
  carregando = false;
  ultimaAtualizacao = '';
  private sub?: Subscription;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.carregar();
    this.sub = interval(30000).subscribe(() => this.carregar(true));
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  carregar(silencioso = false): void {
    if (!silencioso) this.carregando = true;
    forkJoin({
      stats:    this.api.stats(),
      embarques: this.api.listarEmbarques(),
      tarefas:  this.api.listarTarefas()
    }).subscribe({
      next: ({ stats, embarques, tarefas }) => {
        this.stats = stats;
        this.embarquesRecentes = embarques.slice(0, 6);
        this.tarefasUrgentes = tarefas.filter(t => t.status !== 'concluida' && t.status !== 'cancelada').slice(0, 6);
        this.carregando = false;
        this.ultimaAtualizacao = new Date().toLocaleTimeString('pt-BR');
      },
      error: () => { this.carregando = false; }
    });
  }

  statusBadge(status?: string): string {
    const map: Record<string,string> = {
      'Pendente':'badge-pendente','Agendado':'badge-agendado',
      'Em Coleta':'badge-coleta','Em Transporte':'badge-transporte',
      'Entregue':'badge-entregue','Cancelado':'badge-cancelado',
    };
    return map[status||''] || 'badge-pendente';
  }

  get saudacao(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  get nomeUsuario(): string {
    return this.auth.usuarioLogado()?.nome?.split(' ')[0] || 'usuário';
  }
}
