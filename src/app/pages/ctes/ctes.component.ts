import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, CTE, Embarque, Empresa } from '../../services/api.service';
import { LayoutComponent } from '../../components/layout/layout.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-ctes',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent, DatePipe, CurrencyPipe],
  templateUrl: './ctes.component.html',
  styleUrls: ['./ctes.component.css']
})
export class CtesComponent implements OnInit {
  ctes: CTE[] = [];
  embarques: Embarque[] = [];
  empresas: Empresa[] = [];
  filtro = '';
  carregando = false; salvando = false;
  modalAberto = false;
  selecionado: CTE | null = null;
  form: Partial<CTE> = {};

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando = true;
    forkJoin({
      ctes:      this.api.listarCTEs(),
      embarques: this.api.listarEmbarques(),
      empresas:  this.api.listarEmpresas()
    }).subscribe({
      next: ({ ctes, embarques, empresas }) => {
        this.ctes = ctes;
        this.embarques = embarques;
        this.empresas = empresas;
        this.carregando = false;
      },
      error: () => { this.carregando = false; }
    });
  }

  get filtradas(): CTE[] {
    if (!this.filtro) return this.ctes;
    return this.ctes.filter(c => c.status === this.filtro);
  }

  abrirModal(c: CTE | null = null): void {
    this.selecionado = c;
    this.form = c ? { ...c } : { status: 'pendente' };
    this.modalAberto = true;
  }
  editar(c: CTE): void { this.abrirModal(c); }
  fecharModal(ev?: MouseEvent): void { this.modalAberto = false; this.selecionado = null; }

  salvar(): void {
    if (!this.form.numero_cte?.trim()) return;
    this.salvando = true;
    const obs = this.selecionado?.id
      ? this.api.atualizarCTE(this.selecionado.id, this.form as CTE)
      : this.api.salvarCTE(this.form as CTE);
    obs.subscribe({
      next: () => { this.salvando = false; this.fecharModal(); this.carregar(); },
      error: () => { this.salvando = false; }
    });
  }

  aprovar(c: CTE): void {
    this.api.atualizarCTE(c.id!, { ...c, status: 'aprovado' }).subscribe(() => this.carregar());
  }

  deletar(c: CTE): void {
    if (!confirm(`Excluir CTE ${c.numero_cte}?`)) return;
    this.api.deletarCTE(c.id!).subscribe(() => this.carregar());
  }

  statusCTE(s?: string): string {
    const m: Record<string, string> = {
      pendente: 'badge-pendente', aprovado: 'badge-entregue', cancelado: 'badge-cancelado'
    };
    return m[s || ''] || 'badge-pendente';
  }
}
