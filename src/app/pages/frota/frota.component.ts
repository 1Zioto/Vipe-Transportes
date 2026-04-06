import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Motorista, Veiculo, Empresa } from '../../services/api.service';
import { LayoutComponent } from '../../components/layout/layout.component';
import { forkJoin } from 'rxjs';

type Aba = 'motoristas' | 'veiculos' | 'empresas';
type ModalTipo = 'motorista' | 'veiculo' | 'empresa';

@Component({
  selector: 'app-frota',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './frota.component.html',
  styleUrls: ['./frota.component.css']
})
export class FrotaComponent implements OnInit {
  aba: Aba = 'motoristas';
  motoristas: Motorista[] = [];
  veiculos: Veiculo[] = [];
  empresas: Empresa[] = [];
  carregando = false; salvando = false;
  modalAberto = false;
  modalTipo: ModalTipo = 'motorista';
  selecionado: any = null;
  form: Record<string, any> = {};

  private colors = ['#1e6ef0','#10d48e','#ff8c42','#a78bfa','#f472b6','#00d4ff','#ffd700'];

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando = true;
    forkJoin({
      motoristas: this.api.listarMotoristas(),
      veiculos:   this.api.listarVeiculos(),
      empresas:   this.api.listarEmpresas()
    }).subscribe({
      next: d => { this.motoristas = d.motoristas; this.veiculos = d.veiculos; this.empresas = d.empresas; this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  abrirModal(tipo: ModalTipo, item: any = null): void {
    this.modalTipo = tipo; this.selecionado = item;
    this.form = item ? { ...item } : {};
    this.modalAberto = true;
  }
  editarItem(tipo: ModalTipo, item: any): void { this.abrirModal(tipo, item); }
  fecharModal(ev?: MouseEvent): void { this.modalAberto = false; this.selecionado = null; }

  get modalTitulo(): string {
    const map = { motorista: 'Motorista', veiculo: 'Veículo', empresa: 'Empresa' };
    return (this.selecionado ? 'Editar ' : 'Novo ') + map[this.modalTipo];
  }

  salvar(): void {
    this.salvando = true;
    const recursos: Record<ModalTipo, string> = { motorista:'motoristas', veiculo:'veiculos', empresa:'empresas' };
    const r = recursos[this.modalTipo];
    const obs = this.selecionado?.id
      ? this.api.atualizar(r, this.selecionado.id, this.form)
      : this.api.criar(r, this.form);
    obs.subscribe({
      next: () => { this.salvando = false; this.fecharModal(); this.carregar(); },
      error: () => { this.salvando = false; }
    });
  }

  deletarItem(recurso: string, id?: number): void {
    if (!id || !confirm('Deseja excluir este registro?')) return;
    this.api.deletar(recurso, id).subscribe(() => this.carregar());
  }

  iniciais(nome: string): string {
    return (nome || 'X').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }
  randomColor(id?: number): string {
    return this.colors[(id || 0) % this.colors.length];
  }
}
