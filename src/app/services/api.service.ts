import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Cliente    { id?: number; nome: string; cnpj?: string; contato?: string; email?: string; }
export interface Armador    { id?: number; nome: string; codigo?: string; }
export interface Armazem    { id?: number; nome: string; municipio?: string; uf?: string; endereco?: string; }
export interface Destino    { id?: number; pais: string; porto?: string; codigo?: string; }
export interface Mercadoria { id?: number; descricao: string; ncm?: string; unidade?: string; }
export interface Motorista  { id?: number; nome: string; cpf?: string; cnh?: string; telefone?: string; }
export interface Veiculo    { id?: number; placa: string; tipo?: string; modelo?: string; ano?: number; }
export interface Empresa    { id?: number; razao_social: string; cnpj?: string; cidade?: string; uf?: string; }

export interface Embarque {
  id?: number; booking?: string; contrato?: string;
  cliente_id?: number; armador_id?: number; armazem_id?: number;
  destino_id?: number; mercadoria_id?: number;
  cliente?: string; armador?: string; armazem?: string; destino?: string; mercadoria?: string;
  municipio?: string; uf?: string; navio?: string;
  quantCntr?: number; embalagem?: string; quantTotal?: number;
  pesoLiquido?: number; pesoBruto?: number;
  dataColeta?: string; dataCarreg?: string; status?: string;
  fito?: boolean|number; fumigacao?: boolean|number;
  higienizacao?: boolean|number; forracaoDupla?: boolean|number;
  createdAt?: string; updatedAt?: string;
}

export interface Tarefa {
  id?: number; titulo: string; descricao?: string; responsavel?: string;
  embarque_id?: number; embarque_booking?: string;
  prioridade?: 'baixa'|'media'|'alta'|'urgente';
  status?: 'pendente'|'em_andamento'|'concluida'|'cancelada';
  data_vencimento?: string; created_by?: number; criado_por?: string;
  created_at?: string; updated_at?: string;
}

export interface CTE {
  id?: number; numero_cte: string; embarque_id?: number; empresa_id?: number;
  valor?: number; data_emissao?: string;
  status?: 'pendente'|'aprovado'|'cancelado'; observacoes?: string;
  embarque_booking?: string; empresa_nome?: string;
}

export interface Stats {
  total: number; pendentes: number; em_transporte: number; entregues: number;
  tarefas_pendentes: number; tarefas_urgentes: number; ctes_pendentes: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly BASE = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // Stats
  stats(): Observable<Stats> { return this.http.get<Stats>(`${this.BASE}/stats`); }

  // Embarques
  listarEmbarques(): Observable<Embarque[]> { return this.http.get<Embarque[]>(`${this.BASE}/embarques`); }
  salvarEmbarque(e: Embarque): Observable<Embarque> { return this.http.post<Embarque>(`${this.BASE}/embarques`, e); }
  atualizarEmbarque(id: number, e: Embarque): Observable<Embarque> { return this.http.put<Embarque>(`${this.BASE}/embarques/${id}`, e); }
  deletarEmbarque(id: number): Observable<any> { return this.http.delete(`${this.BASE}/embarques/${id}`); }

  // Tarefas
  listarTarefas(): Observable<Tarefa[]> { return this.http.get<Tarefa[]>(`${this.BASE}/tarefas`); }
  salvarTarefa(t: Tarefa): Observable<Tarefa> { return this.http.post<Tarefa>(`${this.BASE}/tarefas`, t); }
  atualizarTarefa(id: number, t: Tarefa): Observable<Tarefa> { return this.http.put<Tarefa>(`${this.BASE}/tarefas/${id}`, t); }
  deletarTarefa(id: number): Observable<any> { return this.http.delete(`${this.BASE}/tarefas/${id}`); }

  // CTEs
  listarCTEs(): Observable<CTE[]> { return this.http.get<CTE[]>(`${this.BASE}/ctes`); }
  salvarCTE(c: CTE): Observable<CTE> { return this.http.post<CTE>(`${this.BASE}/ctes`, c); }
  atualizarCTE(id: number, c: CTE): Observable<CTE> { return this.http.put<CTE>(`${this.BASE}/ctes/${id}`, c); }
  deletarCTE(id: number): Observable<any> { return this.http.delete(`${this.BASE}/ctes/${id}`); }

  // Genérico
  listar<T>(r: string): Observable<T[]> { return this.http.get<T[]>(`${this.BASE}/${r}`); }
  criar<T>(r: string, d: T): Observable<T> { return this.http.post<T>(`${this.BASE}/${r}`, d); }
  atualizar<T>(r: string, id: number, d: T): Observable<T> { return this.http.put<T>(`${this.BASE}/${r}/${id}`, d); }
  deletar(r: string, id: number): Observable<any> { return this.http.delete(`${this.BASE}/${r}/${id}`); }

  listarClientes():    Observable<Cliente[]>    { return this.listar('clientes'); }
  listarArmadores():   Observable<Armador[]>    { return this.listar('armadores'); }
  listarArmazens():    Observable<Armazem[]>    { return this.listar('armazens'); }
  listarDestinos():    Observable<Destino[]>    { return this.listar('destinos'); }
  listarMercadorias(): Observable<Mercadoria[]> { return this.listar('mercadorias'); }
  listarMotoristas():  Observable<Motorista[]>  { return this.listar('motoristas'); }
  listarVeiculos():    Observable<Veiculo[]>    { return this.listar('veiculos'); }
  listarEmpresas():    Observable<Empresa[]>    { return this.listar('empresas'); }
}
