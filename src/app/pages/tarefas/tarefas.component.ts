import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Tarefa, Embarque } from '../../services/api.service';
import { LayoutComponent } from '../../components/layout/layout.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-tarefas',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent, DatePipe],
  templateUrl: './tarefas.component.html',
  styleUrls: ['./tarefas.component.css']
})
export class TarefasComponent implements OnInit {
  tarefas: Tarefa[] = [];
  embarques: Embarque[] = [];
  filtro = '';
  carregando = false; salvando = false;
  modalAberto = false;
  selecionado: Tarefa | null = null;
  form: Partial<Tarefa> = {};

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando = true;
    forkJoin({ tarefas: this.api.listarTarefas(), embarques: this.api.listarEmbarques() }).subscribe({
      next: ({ tarefas, embarques }) => {
        this.tarefas = tarefas;
        this.embarques = embarques;
        this.carregando = false;
      },
      error: () => { this.carregando = false; }
    });
  }

  get filtradas(): Tarefa[] {
    const prios = ['urgente','alta','media','baixa'];
    const statusOrder: Record<string,number> = { pendente:0, em_andamento:1, concluida:2, cancelada:3 };
    let l = this.tarefas;
    if (['urgente','alta','media','baixa'].includes(this.filtro)) l = l.filter(t => t.prioridade === this.filtro);
    else if (this.filtro) l = l.filter(t => t.status === this.filtro);
    return [...l].sort((a, b) => {
      const sd = (statusOrder[a.status||''] ?? 99) - (statusOrder[b.status||''] ?? 99);
      if (sd !== 0) return sd;
      return prios.indexOf(a.prioridade||'media') - prios.indexOf(b.prioridade||'media');
    });
  }

  get urgentes(): number { return this.tarefas.filter(t => t.prioridade === 'urgente' && t.status !== 'concluida').length; }

  abrirModal(t: Tarefa|null = null): void {
    this.selecionado = t;
    this.form = t ? { ...t } : { prioridade: 'media', status: 'pendente' };
    this.modalAberto = true;
  }
  editar(t: Tarefa): void { this.abrirModal(t); }
  fecharModal(ev?: MouseEvent): void { this.modalAberto = false; this.selecionado = null; }

  salvar(): void {
    if (!this.form.titulo?.trim()) return;
    this.salvando = true;
    const obs = this.selecionado?.id
      ? this.api.atualizarTarefa(this.selecionado.id, this.form as Tarefa)
      : this.api.salvarTarefa(this.form as Tarefa);
    obs.subscribe({
      next: () => { this.salvando = false; this.fecharModal(); this.carregar(); },
      error: () => { this.salvando = false; }
    });
  }

  concluir(t: Tarefa): void {
    this.api.atualizarTarefa(t.id!, { ...t, status: 'concluida' }).subscribe(() => this.carregar());
  }

  deletar(t: Tarefa): void {
    if (!confirm(`Excluir tarefa "${t.titulo}"?`)) return;
    this.api.deletarTarefa(t.id!).subscribe(() => this.carregar());
  }

  isVencida(d: string): boolean { return new Date(d) < new Date(); }

  statusTaskBadge(s?: string): string {
    const m: Record<string,string> = { pendente:'badge-pendente', em_andamento:'badge-agendado', concluida:'badge-entregue', cancelada:'badge-cancelado' };
    return m[s||''] || 'badge-pendente';
  }
  statusTaskLabel(s?: string): string {
    const m: Record<string,string> = { pendente:'Pendente', em_andamento:'Em andamento', concluida:'Concluída', cancelada:'Cancelada' };
    return m[s||''] || s || '';
  }
}
