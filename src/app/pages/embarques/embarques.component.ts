import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Embarque, Cliente, Armador, Armazem, Destino, Mercadoria } from '../../services/api.service';
import { LayoutComponent } from '../../components/layout/layout.component';
import { forkJoin } from 'rxjs';

type SortField = keyof Embarque;

@Component({
  selector: 'app-embarques',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent, DatePipe],
  templateUrl: './embarques.component.html',
  styleUrls: ['./embarques.component.css']
})
export class EmbarquesComponent implements OnInit {
  embarques: Embarque[] = [];
  clientes: Cliente[] = []; armadores: Armador[] = [];
  armazens: Armazem[] = []; destinos: Destino[] = []; mercadorias: Mercadoria[] = [];

  busca = ''; filtroStatus = '';
  sortField: SortField = 'id'; sortDir: 'asc'|'desc' = 'desc';
  carregando = false; salvando = false;
  modalAberto = false;
  selecionado: Embarque | null = null;

  form: Partial<Embarque> = {};

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando = true;
    forkJoin({
      embarques: this.api.listarEmbarques(),
      clientes:  this.api.listarClientes(),
      armadores: this.api.listarArmadores(),
      armazens:  this.api.listarArmazens(),
      destinos:  this.api.listarDestinos(),
      mercadorias: this.api.listarMercadorias()
    }).subscribe({
      next: d => {
        this.embarques = d.embarques;
        this.clientes = d.clientes; this.armadores = d.armadores;
        this.armazens = d.armazens; this.destinos = d.destinos;
        this.mercadorias = d.mercadorias;
        this.carregando = false;
      },
      error: () => { this.carregando = false; }
    });
  }

  get filtrados(): Embarque[] {
    const t = this.busca.toLowerCase().trim();
    let l = this.embarques;
    if (t) l = l.filter(e =>
      (e.booking||'').toLowerCase().includes(t) ||
      (e.contrato||'').toLowerCase().includes(t) ||
      (e.cliente||'').toLowerCase().includes(t)
    );
    if (this.filtroStatus) l = l.filter(e => e.status === this.filtroStatus);
    return [...l].sort((a, b) => {
      const va = String(a[this.sortField]??'').toLowerCase();
      const vb = String(b[this.sortField]??'').toLowerCase();
      const c = va.localeCompare(vb, 'pt-BR', { numeric: true });
      return this.sortDir === 'asc' ? c : -c;
    });
  }

  ordenar(f: SortField): void {
    if (this.sortField === f) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortField = f; this.sortDir = 'asc'; }
  }
  sortIcon(f: SortField): string {
    if (this.sortField !== f) return '↕';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  abrirModal(e: Embarque|null = null): void {
    this.selecionado = e;
    this.form = e ? { ...e } : { status: 'Pendente' };
    this.modalAberto = true;
  }
  editar(e: Embarque): void { this.abrirModal(e); }
  fecharModal(ev?: MouseEvent): void { this.modalAberto = false; this.selecionado = null; }

  salvar(): void {
    if (this.salvando) return;
    this.salvando = true;
    const obs = this.selecionado?.id
      ? this.api.atualizarEmbarque(this.selecionado.id, this.form as Embarque)
      : this.api.salvarEmbarque(this.form as Embarque);
    obs.subscribe({
      next: () => { this.salvando = false; this.fecharModal(); this.carregar(); },
      error: () => { this.salvando = false; }
    });
  }

  deletar(e: Embarque): void {
    if (!confirm(`Excluir embarque ${e.booking}?`)) return;
    this.api.deletarEmbarque(e.id!).subscribe(() => this.carregar());
  }

  statusBadge(s?: string): string {
    const m: Record<string,string> = {
      'Pendente':'badge-pendente','Agendado':'badge-agendado','Em Coleta':'badge-coleta',
      'Em Transporte':'badge-transporte','Entregue':'badge-entregue','Cancelado':'badge-cancelado'
    };
    return m[s||''] || 'badge-pendente';
  }
}
