import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../components/layout/layout.component';
import { AuthService, Usuario } from '../../services/auth.service';
import { PerfisService, Perfil } from '../../services/perfis.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  usuarioAtual: Usuario | null = null;
  isAdmin = false;
  usuarios: Perfil[] = [];
  carregando = false;
  erroLista = '';
  modalCriar = false;
  criando = false;
  erroCriar = '';
  novoCriado = false;
  formCriar = { email: '', senha: '', nome: '', papel: 'operador' };
  modalEditar: Perfil | null = null;
  formEditar = { nome: '', papel: '', ativo: true };
  salvandoEdit = false;
  erroEdit = '';
  formPerfil = { nome: '', cargo: '' };
  salvandoPerfil = false;
  salvoMsg = false;
  erroPerfil = '';
  readonly papeis = [
    { value: 'admin',      label: 'Administrador', icon: '👑' },
    { value: 'operador',   label: 'Operador',       icon: '⚙️' },
    { value: 'financeiro', label: 'Financeiro',     icon: '💰' },
    { value: 'consultor',  label: 'Consultor',      icon: '🔍' },
    { value: 'motorista',  label: 'Motorista',      icon: '🚫' },
  ];
  readonly acessosPorPapel: Record<string, string[]> = {
    admin:      ['Dashboard', 'Embarques', 'Tarefas', 'CTes', 'Usuários', 'Frota', 'Mapa', 'Relatórios'],
    operador:   ['Dashboard', 'Embarques', 'Tarefas', 'CTes', 'Frota', 'Mapa'],
    financeiro: ['Dashboard', 'CTes', 'Relatórios'],
    consultor:  ['Dashboard', 'Embarques', 'CTes', 'Relatórios'],
    motorista:  ['Dashboard', 'Mapa'],
  };
  readonly colors = ['#ffd700','#10d48e','#ff8c42','#a78bfa','#f472b6','#00d4ff'];
  constructor(private auth: AuthService, private perfisService: PerfisService) {}
  ngOnInit(): void {
    this.usuarioAtual = this.auth.usuarioLogado();
    this.isAdmin = this.auth.isAdmin;
    this.formPerfil = { nome: this.usuarioAtual?.nome || '', cargo: this.usuarioAtual?.papel || 'operador' };
    if (this.isAdmin) this.carregarUsuarios();
  }
  async carregarUsuarios(): Promise<void> {
    this.carregando = true; this.erroLista = '';
    try { this.usuarios = await this.perfisService.listar(); }
    catch (e: any) { this.erroLista = e?.message || 'Erro ao carregar usuários.'; }
    finally { this.carregando = false; }
  }
  abrirModalCriar(): void { this.formCriar = { email: '', senha: '', nome: '', papel: 'operador' }; this.erroCriar = ''; this.novoCriado = false; this.modalCriar = true; }
  fecharModalCriar(): void { this.modalCriar = false; }
  async criarUsuario(): Promise<void> {
    const { email, senha, nome, papel } = this.formCriar;
    if (!email || !senha || !nome) { this.erroCriar = 'Preencha todos os campos obrigatórios.'; return; }
    if (senha.length < 6) { this.erroCriar = 'A senha deve ter pelo menos 6 caracteres.'; return; }
    this.criando = true; this.erroCriar = '';
    try { await this.perfisService.criarUsuario(email, senha, nome, papel); this.novoCriado = true; this.criando = false; await this.carregarUsuarios(); setTimeout(() => { this.modalCriar = false; this.novoCriado = false; }, 2000); }
    catch (e: any) { this.criando = false; this.erroCriar = e?.message || 'Erro ao criar usuário.'; }
  }
  abrirEditar(u: Perfil): void { this.modalEditar = u; this.formEditar = { nome: u.nome, papel: u.papel, ativo: u.ativo }; this.erroEdit = ''; }
  fecharEditar(): void { this.modalEditar = null; }
  async salvarEditar(): Promise<void> {
    if (!this.modalEditar) return; this.salvandoEdit = true; this.erroEdit = '';
    try { await this.perfisService.atualizar(this.modalEditar.id, { nome: this.formEditar.nome, papel: this.formEditar.papel, ativo: this.formEditar.ativo }); const idx = this.usuarios.findIndex(u => u.id === this.modalEditar!.id); if (idx >= 0) this.usuarios[idx] = { ...this.usuarios[idx], ...this.formEditar }; this.modalEditar = null; }
    catch (e: any) { this.erroEdit = e?.message || 'Erro ao salvar.'; }
    finally { this.salvandoEdit = false; }
  }
  async toggleAtivo(u: Perfil): Promise<void> {
    try { await this.perfisService.atualizar(u.id, { ativo: !u.ativo }); u.ativo = !u.ativo; }
    catch (e: any) { alert('Erro: ' + (e?.message || 'Não foi possível alterar o status.')); }
  }
  async salvarPerfil(): Promise<void> {
    if (!this.usuarioAtual) return; this.salvandoPerfil = true; this.erroPerfil = '';
    try { await this.perfisService.atualizarProprioPerfil(this.usuarioAtual.id, this.formPerfil.nome, this.formPerfil.cargo); this.salvoMsg = true; setTimeout(() => this.salvoMsg = false, 2500); }
    catch (e: any) { this.erroPerfil = e?.message || 'Erro ao salvar perfil.'; }
    finally { this.salvandoPerfil = false; }
  }
  papelLabel(papel: string): string { return this.papeis.find(p => p.value === papel)?.label || papel; }
  papelIcon(papel: string): string { return this.papeis.find(p => p.value === papel)?.icon || '👤'; }
  papelBadgeClass(papel: string): string { const m: Record<string, string> = { admin: 'badge badge-admin', operador: 'badge badge-operador', financeiro: 'badge badge-financeiro' , consultor: 'badge badge-consultor', motorista: 'badge badge-motorista' }; return m[papel] || 'badge badge-operador'; }
  acessos(papel: string): string[] { return this.acessosPorPapel[papel] || []; }
  get iniciais(): string { const n = this.usuarioAtual?.nome || 'U'; return n.split(' ').map((p: string) => p[0]).slice(0,2).join('').toUpperCase(); }
  get avatarColor(): string { const id = this.usuarioAtual?.id || ''; const hash = id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0); return this.colors[hash % this.colors.length]; }
  avatarColorFor(id: string): string { const hash = id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0); return this.colors[hash % this.colors.length]; }
  iniciaisFor(nome: string): string { return (nome || 'U').split(' ').map((p: string) => p[0]).slice(0,2).join('').toUpperCase(); }
  ehEuMesmo(id: string): boolean { return id === this.usuarioAtual?.id; }
}
