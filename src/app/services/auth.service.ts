import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, map, catchError, throwError } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  usuarioLogado = signal<Usuario | null>(this._loadFromStorage());

  constructor(private supabase: SupabaseService, private router: Router) {
    // Sync session on init
    this.supabase.client.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        this.usuarioLogado.set(this._toUsuario(data.session.user));
      } else {
        this.usuarioLogado.set(null);
      }
    });

    // Listen for auth state changes
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this.usuarioLogado.set(session?.user ? this._toUsuario(session.user) : null);
    });
  }

  private _toUsuario(user: any): Usuario {
    return {
      id: user.id,
      nome: user.user_metadata?.['nome'] || user.email?.split('@')[0] || 'Usuário',
      email: user.email || '',
      cargo: user.user_metadata?.['cargo'] || 'Operador',
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
}
