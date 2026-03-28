import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  cargo?: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly BASE   = environment.apiUrl;
  private readonly TK     = 'vipe_token';
  private readonly UK     = 'vipe_user';

  usuarioLogado = signal<Usuario | null>(this.carregarUsuario());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.BASE}/auth/login`, { email, senha }).pipe(
      tap(res => {
        localStorage.setItem(this.TK, res.token);
        localStorage.setItem(this.UK, JSON.stringify(res.usuario));
        this.usuarioLogado.set(res.usuario);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TK);
    localStorage.removeItem(this.UK);
    this.usuarioLogado.set(null);
    this.router.navigate(['/login']);
  }

  get token(): string | null { return localStorage.getItem(this.TK); }
  get estaLogado(): boolean  { return !!this.token; }

  private carregarUsuario(): Usuario | null {
    try { const r = localStorage.getItem(this.UK); return r ? JSON.parse(r) : null; }
    catch { return null; }
  }
}
