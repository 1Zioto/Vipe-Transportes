import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LayoutComponent } from '../../components/layout/layout.component';

export interface Usuario {
  id?: number;
  nome: string;
  email: string;
  cargo?: string;
  ativo?: number;
  permissoes?: Record<string, string>;
}

type NivelAcesso = 'none' | 'read' | 'write';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  carregando = false;
  salvando = false;
  salvandoPerm: number | null = null;
  savedMsg: number | null = null;
  modalAberto = false;
  selecionado: Usuario | null = null;
  erro = '';
  form: Partial<Usuario & { senha: string }> = {};

  // Mapa local de permissões: { userId: { modulo: nivel } }
  permsMap: Record<number, Record<string, NivelAcesso>> = {};

  readonly modulos = [
    { key: 'embarques',  label: 'Embarques',  icon: '📦' },
    { key: 'tarefas',    label: 'Tarefas',    icon: '✅' },
    { key: 'ctes',       label: 'CTEs',       icon: '📄' },
    { key: 'frota',      label: 'Frota',      icon: '🚛' },
    { key: 'relatorios', label: 'Relatórios', icon: '📊' },
    { key: 'usuarios',   label: 'Usuários',   icon: '👥' },
  ];

  private readonly colors = ['#1e6ef0','#10d48e','#ff8c42','#a78bfa','#f472b6','#00d4ff','#ffd700'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.carregar(); }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('vipe_token') || ''}` });
  }

  carregar(): void {
    this.carregando = true;
    this.http.get<Usuario[]>(`${environment.apiUrl}/usuarios`, { headers: this.headers() }).subscribe({
      next: (users) => {
        this.usuarios = users;
        // Carregar permissões de cada usuário
        users.forEach(u => {
          if (u.id) {
            this.http.get<Record<string, string>>(`${environment.apiUrl}/usuarios/${u.id}/permissoes`, { headers: this.headers() })
              .subscribe({
                next: (p) => { this.permsMap[u.id!] = p as Record<string, NivelAcesso>; },
                error: () => {
                  // Se não tiver permissões, inicializar com 'none'
                  this.permsMap[u.id!] = {};
                  this.modulos.forEach(m => { this.permsMap[u.id!][m.key] = 'none'; });
                }
              });
          }
        });
        this.carregando = false;
      },
      error: () => { this.carregando = false; }
    });
  }

  getPerm(u: Usuario, modulo: string): NivelAcesso {
    if (!u.id || !this.permsMap[u.id]) return 'none';
    return (this.permsMap[u.id][modulo] || 'none') as NivelAcesso;
  }

  setPerm(u: Usuario, modulo: string, nivel: NivelAcesso): void {
    if (!u.id) return;
    if (!this.permsMap[u.id]) this.permsMap[u.id] = {};
    this.permsMap[u.id][modulo] = nivel;
  }

  salvarPermissoes(u: Usuario): void {
    if (!u.id) return;
    this.salvandoPerm = u.id;
    this.http.put(
      `${environment.apiUrl}/usuarios/${u.id}/permissoes`,
      this.permsMap[u.id] || {},
      { headers: this.headers() }
    ).subscribe({
      next: () => {
        this.salvandoPerm = null;
        this.savedMsg = u.id!;
        setTimeout(() => { this.savedMsg = null; }, 2500);
      },
      error: () => { this.salvandoPerm = null; }
    });
  }

  abrirModal(u: Usuario | null = null): void {
    this.selecionado = u;
    this.form = u ? { ...u, senha: '' } : { cargo: 'Operador' };
    this.erro = '';
    this.modalAberto = true;
  }

  editar(u: Usuario): void { this.abrirModal(u); }

  fecharModal(ev?: MouseEvent): void {
    this.modalAberto = false;
    this.selecionado = null;
    this.erro = '';
  }

  salvar(): void {
    if (!this.form.nome?.trim() || !this.form.email?.trim()) {
      this.erro = 'Nome e e-mail são obrigatórios.'; return;
    }
    if (!this.selecionado && !this.form.senha?.trim()) {
      this.erro = 'Senha é obrigatória para novo usuário.'; return;
    }
    this.salvando = true;
    this.erro = '';

    if (this.selecionado?.id) {
      // Editar dados básicos
      const obs = this.http.put(
        `${environment.apiUrl}/usuarios/${this.selecionado.id}/dados`,
        { nome: this.form.nome, email: this.form.email, cargo: this.form.cargo },
        { headers: this.headers() }
      );
      obs.subscribe({
        next: () => {
          // Mudar senha se preenchida
          if (this.form.senha?.trim()) {
            this.http.put(
              `${environment.apiUrl}/usuarios/${this.selecionado!.id}/senha`,
              { senha: this.form.senha },
              { headers: this.headers() }
            ).subscribe(() => { this.salvando = false; this.fecharModal(); this.carregar(); });
          } else {
            this.salvando = false; this.fecharModal(); this.carregar();
          }
        },
        error: (err) => { this.salvando = false; this.erro = err?.error?.message || 'Erro ao salvar.'; }
      });
    } else {
      // Criar novo
      this.http.post(
        `${environment.apiUrl}/usuarios`,
        { nome: this.form.nome, email: this.form.email, senha: this.form.senha, cargo: this.form.cargo },
        { headers: this.headers() }
      ).subscribe({
        next: () => { this.salvando = false; this.fecharModal(); this.carregar(); },
        error: (err) => { this.salvando = false; this.erro = err?.error?.message || 'Erro ao criar usuário.'; }
      });
    }
  }

  desativar(u: Usuario): void {
    if (!confirm(`Desativar usuário "${u.nome}"?`)) return;
    this.http.delete(`${environment.apiUrl}/usuarios/${u.id}`, { headers: this.headers() })
      .subscribe(() => this.carregar());
  }

  iniciais(nome: string): string {
    return (nome || 'U').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }

  avatarColor(id?: number): string {
    return this.colors[(id || 0) % this.colors.length];
  }

  cargoBadge(cargo?: string): string {
    const m: Record<string, string> = {
      'Administrador': 'badge badge-admin',
      'Operador':      'badge badge-operador',
      'Consultor':     'badge badge-consultor',
      'Financeiro':    'badge badge-financeiro',
      'Motorista':     'badge badge-motorista',
    };
    return m[cargo || ''] || 'badge badge-operador';
  }
}
