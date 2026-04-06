import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Perfil {
  id: string;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
  criado_em: string;
}

@Injectable({ providedIn: 'root' })
export class PerfisService {
  constructor(private supabase: SupabaseService) {}

  async listar(): Promise<Perfil[]> {
    const { data, error } = await this.supabase.client
      .from('perfis')
      .select('*')
      .order('criado_em', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async atualizar(id: string, campos: Partial<Perfil>): Promise<void> {
    const { error } = await this.supabase.client
      .from('perfis')
      .update(campos)
      .eq('id', id);
    if (error) throw error;
  }

  async criarUsuario(email: string, senha: string, nome: string, papel: string): Promise<string> {
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password: senha,
      options: { data: { nome, papel } }
    });
    if (error) throw error;
    const uid = data.user?.id;
    if (!uid) throw new Error('Usuário criado mas ID não retornado');
    await this.supabase.client.from('perfis').upsert({
      id: uid, nome, email, papel, ativo: true
    });
    return uid;
  }

  async atualizarProprioPerfil(id: string, nome: string, cargo: string): Promise<void> {
    const { error } = await this.supabase.client.auth.updateUser({
      data: { nome, papel: cargo, cargo }
    });
    if (error) throw error;
    await this.atualizar(id, { nome, papel: cargo });
  }
}
