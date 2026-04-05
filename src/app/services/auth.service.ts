import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, map, catchError, throwError } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
  papel: string; // 'admin' | 'operador' | 'financeiro' | 'consultor' | 'motorista'
}

// Módulos acessíveis por papel
const ACESSO: Record<string, string[]> = {
  admin:      ['*'],
  operador:   ['dashboard','embarques','tarefas','ctes','frota','mapa'],
  financeiro: ['dashboard','ctes','relatorios'],
  consultor:  ['dashboard','embarques','ctes','relatorios'],
  motorista:  ['dashboard','mapa'],
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  usuarioLogado = signal<Usuario | null>(this._loadFromStorage());

  constructor(private supabase: SupabaseService, private router: Router) {
    this.supabase.client.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        this._enrichAndSet(data.session.user);
      } else {
        this.usuarioLogado.set(null);
      }
    });

    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        this._enrichAndSet(session.user);
      } else {
        this.usuarioLogado.set(null);
      }
    });
  }

  /** Carrega papel da tabela perfis (mais seguro que user_metadata) */
  private async _enrichAndSet(user: any): Promise<void> {
    const base = this._toUsuario(user);
    try {
      const { data } = await this.supabase.client
        .from('perfis')
        .select('papel, nome')
        .eq('id', user.id)
        .single();
      if (data) {
        base.papel = data.papel || base.papel;
        if (data.nome) base.nome = data.nome;
      }
    } catch { /* usa fallback do user_metadata */ }
    this.usuarioLogado.set(base);
  }

  private _toUsuario(user: any): Usuario {
    return {
      id: user.id,
      nome: user.user_metadata?.['nome'] || user.email?.split('@')[0] || 'Usuário',
      email: user.email || '',
      cargo: user.user_metadata?.['papel'] || user.user_metadata?.['cargo'] || 'Operador',
      papel: (user.user_metadata?.['papel'] || user.user_metadata?.['cargo'] || 'operador').toLowerCase(),
    };
  }

  private _loadFromStorage(): Usuario | null {
    try {
      const key = `sb-clwdtnodpozrtippxjtx-auth-token`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      const user = data?.user;
      if (!user) return null;
      return this._toUsuario(user);
    } catch { return null; }
  }

  login(email: string, senha: string): Observable<any> {
    return from(
      this.supabase.client.auth.signInWithPassword({ email, password: senha })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError(err => throwError(() => ({ error: { message: err.message || 'Credenciais inválidas.' } })))
    );
  }

  logout(): void {
    this.supabase.client.auth.signOut().then(() => {
      this.usuarioLogado.set(null);
      this.router.navigate(['/login']);
    });
  }

  get estaLogado(): boolean { return !!this.usuarioLogado(); }
  get token(): string | null { return 'managed-by-supabase'; }

  get isAdmin(): boolean {
    return this.usuarioLogado()?.papel === 'admin';
  }

  podeAcessar(modulo: string): boolean {
    const papel = this.usuarioLogado()?.papel || 'operador';
    const perms = ACESSO[papel] || ACESSO['operador'];
    return perms.includes('*') || perms.includes(modulo);
  }
}
