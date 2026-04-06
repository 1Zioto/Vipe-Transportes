import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService, Embarque, Tarefa } from '../../services/api.service';
import { LayoutComponent } from '../../components/layout/layout.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutComponent, DatePipe],
  templateUrl: './relatorios.component.html',
  styleUrls: ['./relatorios.component.css']
})
export class RelatoriosComponent implements OnInit {
  embarques: Embarque[] = [];
  tarefas: Tarefa[] = [];
  carregando = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando = true;
    forkJoin({ embarques: this.api.listarEmbarques(), tarefas: this.api.listarTarefas() }).subscribe({
      next: ({ embarques, tarefas }) => {
        this.embarques = embarques; this.tarefas = tarefas; this.carregando = false;
      },
      error: () => { this.carregando = false; }
    });
  }

  get kpis() {
    const total = this.embarques.length;
    const ent   = this.embarques.filter(e => e.status === 'Entregue').length;
    const taxa  = total ? Math.round(ent / total * 100) : 0;
    return [
      { label: 'Total Embarques',   value: total, color: 'var(--blue-light)' },
      { label: 'Entregues',         value: ent,   color: 'var(--green)' },
      { label: 'Taxa de Entrega',   value: taxa + '%', color: 'var(--cyan)' },
      { label: 'Tarefas Abertas',   value: this.tarefas.filter(t => t.status !== 'concluida').length, color: 'var(--orange)' },
      { label: 'Tarefas Urgentes',  value: this.tarefas.filter(t => t.prioridade === 'urgente' && t.status !== 'concluida').length, color: 'var(--red)' },
    ];
  }

  get ultimos10(): Embarque[] { return this.embarques.slice(0, 10); }

  get statusStats() {
    const total = this.embarques.length || 1;
    const defs = [
      { key: 'Pendente',      label: 'Pendente',      color: 'var(--yellow)' },
      { key: 'Agendado',      label: 'Agendado',      color: 'var(--blue-light)' },
      { key: 'Em Coleta',     label: 'Em Coleta',     color: 'var(--cyan)' },
      { key: 'Em Transporte', label: 'Em Transporte', color: 'var(--orange)' },
      { key: 'Entregue',      label: 'Entregue',      color: 'var(--green)' },
      { key: 'Cancelado',     label: 'Cancelado',     color: 'var(--red)' },
    ];
    return defs.map(d => ({
      ...d,
      count: this.embarques.filter(e => e.status === d.key).length,
      pct: Math.round(this.embarques.filter(e => e.status === d.key).length / total * 100)
    }));
  }

  get prioStats() {
    const circ = 2 * Math.PI * 40;
    const defs = [
      { key: 'urgente', label: 'Urgente', color: 'var(--red)' },
      { key: 'alta',    label: 'Alta',    color: 'var(--orange)' },
      { key: 'media',   label: 'Média',   color: 'var(--blue-light)' },
      { key: 'baixa',   label: 'Baixa',   color: 'rgba(255,255,255,0.3)' },
    ];
    const total = this.tarefas.length || 1;
    let acc = 0;
    return defs.map(d => {
      const count = this.tarefas.filter(t => t.prioridade === d.key).length;
      const frac  = count / total;
      const dash  = `${frac * circ} ${circ}`;
      const offset = -acc * circ;
      acc += frac;
      return { ...d, count, dash, offset };
    });
  }

  get totalTarefas(): number { return this.tarefas.length; }

  statusBadge(s?: string): string {
    const m: Record<string, string> = {
      'Pendente':'badge-pendente','Agendado':'badge-agendado','Em Coleta':'badge-coleta',
      'Em Transporte':'badge-transporte','Entregue':'badge-entregue','Cancelado':'badge-cancelado'
    };
    return m[s || ''] || 'badge-pendente';
  }
}
