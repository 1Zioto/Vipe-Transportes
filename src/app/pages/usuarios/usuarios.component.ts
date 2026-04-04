import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../components/layout/layout.component';
import { AuthService, Usuario } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  usuarioAtual: Usuario | null = null;
  salvando = false;
  salvoMsg = false;
  erro = '';

  form: { nome: string; cargo: string } = { nome: '', cargo: '' };

  readonly colors = ['#1e6ef0','#10d48e','#ff8c42','#a78bfa','#f472b6','#00d4ff'];

  constructor(private auth: AuthService, private supabase: SupabaseService) {}

  ngOnInit(): void {
    this.usuarioAtual = this.auth.usuarioLogado();
    this.form = {
      nome: this.usuarioAtual?.nome || '',
      cargo: this.usuarioAtual?.cargo || 'Operador',
    };
  }

  salvar(): void {
    this.salvando = true;
    this.erro = '';
    this.supabase.client.auth.updateUser({
      data: { nome: this.form.nome, cargo: this.form.cargo }
    }).then(({ error }) => {
      this.salvando = false;
      if (error) { this.erro = error.message; return; }
      this.salvoMsg = true;
      setTimeout(() => this.salvoMsg = false, 2500);
    });
  }

  get iniciais(): string {
    const n = this.usuarioAtual?.nome || 'U';
    return n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }

  get avatarColor(): string {
    const id = this.usuarioAtual?.id || '';
    const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return this.colors[hash % this.colors.length];
  }

  cargoBadge(cargo?: string): string {
    const m: Record<string, string> = {
      'Administrador': 'badge badge-admin',
      'Operador':      'badge badge-operador',
      'Consultor':     'badge badge-consultor',
      'Financeiro':    'badge badge-financeiro',
    };
    return m[cargo || ''] || 'badge badge-operador';
  }
}
