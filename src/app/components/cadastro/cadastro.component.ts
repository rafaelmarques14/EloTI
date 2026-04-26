import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.css']
})
export class CadastroComponent implements OnInit {
  cadastroForm!: FormGroup;
  cadastroError = false;
  mensagemErro = '';
  hidePassword = true;
  hideConfirmPassword = true;
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
      this.cadastroForm = this.fb.group({
      user: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    console.log('1. O botão foi clicado!');

    if (this.cadastroForm.invalid) {
      console.log('2. O Angular bloqueou! O formulário está INVÁLIDO.');
      
      Object.keys(this.cadastroForm.controls).forEach(key => {
        const errosDoCampo = this.cadastroForm.get(key)?.errors;
        if (errosDoCampo) {
          console.log(`-> Erro no campo '${key}':`, errosDoCampo);
        }
      });

      this.cadastroError = true;
      this.mensagemErro = 'Campos Obrigatórios e a senha mínima 4 caracteres.';
      this.cadastroForm.markAllAsTouched();
      return;
    }
    
    this.cadastroError = false;
    const { user, password, confirmPassword } = this.cadastroForm.value;
    console.log('3. Dados digitados:', { user, password, confirmPassword });

    if (password !== confirmPassword) {
      console.log('4. Bloqueado! As senhas digitadas não são iguais.');
      this.cadastroError = true;
      this.mensagemErro = 'As senhas não coincidem.';
      return;
    }

    console.log('5. Tudo certo! Enviando para o AuthService salvar...');
    
    this.authService.register(user, password).subscribe(success => {
      if (success) {
        console.log('6. Salvo com sucesso no localStorage!');
        alert('Usuário cadastrado com sucesso!');
        this.router.navigate(['/login']);
      } else {
        console.log('6. Bloqueado! O usuário já existe no sistema.');
        this.cadastroError = true;
        this.mensagemErro = 'Este nome de usuário já existe. Escolha outro.';
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/login']);
  }
}
