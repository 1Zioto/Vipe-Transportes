import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = ''; senha = ''; carregando = false;
  erro = ''; mostrarSenha = false;
  emailFocus = false; senhaFocus = false;
  ano = new Date().getFullYear();

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.estaLogado) this.router.navigate(['/dashboard']);
  }

  entrar(): void {
    if (!this.email || !this.senha) { this.erro = 'Preencha e-mail e senha.'; return; }
    this.erro = ''; this.carregando = true;
    this.auth.login(this.email, this.senha).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.carregando = false;
        this.erro = err?.error?.message || 'Credenciais inválidas.';
      }
    });
  }
}
