import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from './supabase.service';

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
  fito?: boolean | number; fumigacao?: boolean | number;
  higienizacao?: boolean | number; forracaoDupla?: boolean | number;
  createdAt?: string; updatedAt?: string;
}

export interface Tarefa {
  id?: number; titulo: string; descricao?: string; responsavel?: string;
  embarque_id?: number; embarque_booking?: string;
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  status?: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  data_vencimento?: string; created_by?: string; criado_por?: string;
  created_at?: string; updated_at?: string;
}

export interface CTE {
  id?: number; numero_cte: string; embarque_id?: number; empresa_id?: number;
  valor?: number; data_emissao?: string;
  status?: 'pendente' | 'aprovado' | 'cancelado'; observacoes?: string;
  embarque_booking?: string; empresa_nome?: string;
}

export interface Stats {
  total: number; pendentes: number; em_transporte: number; entregues: number;
  tarefas_pendentes: number; tarefas_urgentes: number; ctes_pendentes: number;
}

function mapEmbarque(row: any): Embarque {
  return {
    ...row,
    cliente:      row['clientes']?.nome,
    armador:      row['armadores']?.nome,
    armazem:      row['armazens']?.nome,
    municipio:    row['armazens']?.municipio,
    uf:           row['armazens']?.uf,
    destino:      row['destinos']?.pais,
    mercadoria:   row['mercadorias']?.descricao,
    quantCntr:    row['quant_cntr'],
    quantTotal:   row['quant_total'],
    pesoLiquido:  row['peso_liquido'],
    pesoBruto:    row['peso_bruto'],
    dataColeta:   row['data_coleta'],
    dataCarreg:   row['data_carreg'],
    forracaoDupla: row['forracao_dupla'],
    createdAt:    row['created_at'],
    updatedAt:    row['updated_at'],
  };
}

function embarqueToDb(e: Embarque): any {
  const r: any = {
    booking: e.booking, contrato: e.contrato,
    cliente_id: e.cliente_id, armador_id: e.armador_id,
    armazem_id: e.armazem_id, destino_id: e.destino_id, mercadoria_id: e.mercadoria_id,
    navio: e.navio, embalagem: e.embalagem, status: e.status,
    fito: e.fito, fumigacao: e.fumigacao, higienizacao: e.higienizacao,
    quant_cntr: e.quantCntr, quant_total: e.quantTotal,
    peso_liquido: e.pesoLiquido, peso_bruto: e.pesoBruto,
    data_coleta: e.dataColeta, data_carreg: e.dataCarreg,
    forracao_dupla: e.forracaoDupla,
  };
  Object.keys(r).forEach(k => r[k] === undefined && delete r[k]);
  return r;
}

function mapTarefa(row: any): Tarefa {
  return { ...row, embarque_booking: row['embarques']?.booking, criado_por: row['created_by_email'] || row['created_by'] };
}

function mapCTE(row: any): CTE {
  return { ...row, embarque_booking: row['embarques']?.booking, empresa_nome: row['empresas']?.razao_social };
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private get db() { return this.supabase.client; }
  constructor(private supabase: SupabaseService) {}

  stats(): Observable<Stats> {
    return from(Promise.all([
      this.db.from('embarques').select('status'),
      this.db.from('tarefas').select('status, prioridade'),
      this.db.from('ctes').select('status'),
    ])).pipe(map(([emb, tar, cte]) => {
      const embarques = emb.data || [];
      const tarefas   = tar.data || [];
      const ctes      = cte.data || [];
      return {
        total:             embarques.length,
        pendentes:         embarques.filter((e: any) => e.status === 'Pendente').length,
        em_transporte:     embarques.filter((e: any) => e.status === 'Em Transporte').length,
        entregues:         embarques.filter((e: any) => e.status === 'Entregue').length,
        tarefas_pendentes: tarefas.filter((t: any) => t.status === 'pendente').length,
        tarefas_urgentes:  tarefas.filter((t: any) => t.prioridade === 'urgente' && t.status !== 'concluida').length,
        ctes_pendentes:    ctes.filter((c: any) => c.status === 'pendente').length,
      };
    }));
  }

  listarEmbarques(): Observable<Embarque[]> {
    return from(this.db.from('embarques').select('*, clientes(nome), armadores(nome), armazens(nome,municipio,uf), destinos(pais), mercadorias(descricao)').order('id', { ascending: false }))
      .pipe(map(({ data }) => (data || []).map(mapEmbarque)));
  }

  salvarEmbarque(e: Embarque): Observable<Embarque> {
    return from(this.db.from('embarques').insert(embarqueToDb(e)).select().single()).pipe(map(({ data }) => mapEmbarque(data)));
  }

  atualizarEmbarque(id: number, e: Embarque): Observable<Embarque> {
    return from(this.db.from('embarques').update(embarqueToDb(e)).eq('id', id).select().single()).pipe(map(({ data }) => mapEmbarque(data)));
  }

  deletarEmbarque(id: number): Observable<any> { return from(this.db.from('embarques').delete().eq('id', id)); }

  listarTarefas(): Observable<Tarefa[]> {
    return from(this.db.from('tarefas').select('*, embarques(booking)').order('id', { ascending: false })).pipe(map(({ data }) => (data || []).map(mapTarefa)));
  }

  salvarTarefa(t: Tarefa): Observable<Tarefa> {
    const { embarque_booking, criado_por, ...row } = t;
    return from(this.db.from('tarefas').insert(row).select().single()).pipe(map(({ data }) => mapTarefa(data)));
  }

  atualizarTarefa(id: number, t: Tarefa): Observable<Tarefa> {
    const { embarque_booking, criado_por, ...row } = t;
    return from(this.db.from('tarefas').update(row).eq('id', id).select().single()).pipe(map(({ data }) => mapTarefa(data)));
  }

  deletarTarefa(id: number): Observable<any> { return from(this.db.from('tarefas').delete().eq('id', id)); }

  listarCTEs(): Observable<CTE[]> {
    return from(this.db.from('ctes').select('*, embarques(booking), empresas(razao_social)').order('id', { ascending: false })).pipe(map(({ data }) => (data || []).map(mapCTE)));
  }

  salvarCTE(c: CTE): Observable<CTE> {
    const { embarque_booking, empresa_nome, ...row } = c;
    return from(this.db.from('ctes').insert(row).select().single()).pipe(map(({ data }) => mapCTE(data)));
  }

  atualizarCTE(id: number, c: CTE): Observable<CTE> {
    const { embarque_booking, empresa_nome, ...row } = c;
    return from(this.db.from('ctes').update(row).eq('id', id).select().single()).pipe(map(({ data }) => mapCTE(data)));
  }

  deletarCTE(id: number): Observable<any> { return from(this.db.from('ctes').delete().eq('id', id)); }

  listar<T>(tabela: string): Observable<T[]> {
    return from(this.db.from(tabela).select('*').order('id', { ascending: false })).pipe(map(({ data }) => (data || []) as T[]));
  }

  criar<T>(tabela: string, d: T): Observable<T> {
    return from(this.db.from(tabela).insert(d as any).select().single()).pipe(map(({ data }) => data as T));
  }

  atualizar<T>(tabela: string, id: number, d: T): Observable<T> {
    return from(this.db.from(tabela).update(d as any).eq('id', id).select().single()).pipe(map(({ data }) => data as T));
  }

  deletar(tabela: string, id: number): Observable<any> { return from(this.db.from(tabela).delete().eq('id', id)); }

  listarClientes():    Observable<Cliente[]>    { return this.listar('clientes'); }
  listarArmadores():   Observable<Armador[]>    { return this.listar('armadores'); }
  listarArmazens():    Observable<Armazem[]>    { return this.listar('armazens'); }
  listarDestinos():    Observable<Destino[]>    { return this.listar('destinos'); }
  listarMercadorias(): Observable<Mercadoria[]> { return this.listar('mercadorias'); }
  listarMotoristas():  Observable<Motorista[]>  { return this.listar('motoristas'); }
  listarVeiculos():    Observable<Veiculo[]>    { return this.listar('veiculos'); }
  listarEmpresas():    Observable<Empresa[]>    { return this.listar('empresas'); }
}
