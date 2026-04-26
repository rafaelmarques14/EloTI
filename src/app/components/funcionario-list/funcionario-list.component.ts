import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DataService } from '../../services/data.service';
import { Funcionario } from '../../models/funcionario.model';
import { FuncionarioDialogComponent } from '../dialogs/funcionario-dialog/funcionario-dialog.component';
import { NgxMaskPipe } from 'ngx-mask';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-funcionario-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    NgxMaskPipe
  ],
  templateUrl: './funcionario-list.component.html',
  styleUrls: ['./funcionario-list.component.scss']
})
export class FuncionarioListComponent implements OnInit {
  displayedColumns: string[] = ['nome', 'cpf', 'dataNascimento', 'acoes'];
  funcionarios: Funcionario[] = [];

  constructor(
    private dataService: DataService,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadFuncionarios();
  }

  loadFuncionarios(): void {
    this.dataService.getFuncionarios().subscribe(data => {
      this.funcionarios = data;
    });
  }

  openDialog(funcionario?: Funcionario): void {
    const dialogRef = this.dialog.open(FuncionarioDialogComponent, {
      width: '400px',
      data: funcionario ? { ...funcionario } : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadFuncionarios();
      }
    });
  }

  deleteFuncionario(id: number): void {
    if (confirm('Tem certeza que deseja excluir este funcionário?')) {
      this.dataService.deleteFuncionario(id).subscribe(() => {
        this.loadFuncionarios();
      });
    }
  }

  exportarExcel(): void {
    const dadosParaExportar = this.funcionarios.map(func => ({
      'Nome Completo': func.nome,
      'CPF': func.cpf,
      'Data de Nascimento': new Date(func.dataNascimento).toLocaleDateString('pt-BR')
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dadosParaExportar);
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Funcionários');
    XLSX.writeFile(wb, 'relatorio_funcionarios_elo_ti.xlsx');
  }

  importarExcel(event: any): void {
    const target: DataTransfer = <DataTransfer>(event.target);
    
    if (target.files.length !== 1) return;

    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const dataArray = new Uint8Array(e.target.result);
        const wb: XLSX.WorkBook = XLSX.read(dataArray, { type: 'array' });

        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];

        const data = XLSX.utils.sheet_to_json(ws, { raw: false });

        let importados = 0;
        let ignorados = 0; 

        const cpfsRegistrados = new Set(
          this.funcionarios.map(f => String(f.cpf).replace(/\D/g, ''))
        );

        data.forEach((row: any) => {
          const nomeLido = row['Nome'] || row['NOME'] || row['Nome Completo'];
          const cpfLido = row['CPF'] || row['Cpf'];
          const dataLida = row['Data de Nascimento'] || row['Data'] || row['Nascimento'];

          if (nomeLido && cpfLido) {
            const cpfLimpo = String(cpfLido).replace(/\D/g, ''); 

            if (cpfsRegistrados.has(cpfLimpo)) {

              ignorados++;
            } else {

              cpfsRegistrados.add(cpfLimpo);

              const novoFunc = {
                nome: String(nomeLido).trim(),
                cpf: cpfLimpo, 
                dataNascimento: this.formatarDataExcel(dataLida)
              };

              this.dataService.addFuncionario(novoFunc).subscribe();
              importados++;
            }
          }
        });

        this.loadFuncionarios();

        let mensagem = `${importados} funcionários foram importados com sucesso!`;
        if (ignorados > 0) {
          mensagem += `\n${ignorados} funcionários foram ignorados pois o CPF já estava cadastrado.`;
        }
        alert(mensagem);
        
        event.target.value = ''; 

      } catch (error) {
        console.error("Erro detalhado ao ler a planilha:", error);
        alert("Ocorreu um erro ao ler o arquivo. Aperte F12 e olhe a aba 'Console' para ver o motivo exato.");
        event.target.value = '';
      }
    };

    reader.readAsArrayBuffer(target.files[0]);
  }

  private formatarDataExcel(dataExcel: any): string {
    try {
      if (!dataExcel) return new Date().toISOString();

      if (dataExcel instanceof Date) {
        return isNaN(dataExcel.getTime()) ? new Date().toISOString() : dataExcel.toISOString();
      }

      if (typeof dataExcel === 'number') {
        const dateFromSerial = new Date((dataExcel - 25569) * 86400 * 1000);
        return isNaN(dateFromSerial.getTime()) ? new Date().toISOString() : dateFromSerial.toISOString();
      }

      const dataString = String(dataExcel).trim();
      
      if (dataString.includes('/')) {
        const partes = dataString.split('/');
        if (partes.length === 3) {
          const dia = parseInt(partes[0], 10);
          const mes = parseInt(partes[1], 10) - 1;
          let ano = parseInt(partes[2], 10);

          if (ano < 100) ano += (ano > 30 ? 1900 : 2000);

          const dateBR = new Date(ano, mes, dia, 12, 0, 0);
          if (!isNaN(dateBR.getTime())) {
            return dateBR.toISOString();
          }
        }
      }

      const fallbackDate = new Date(dataString);
      if (!isNaN(fallbackDate.getTime())) {
        return fallbackDate.toISOString();
      }

      return new Date().toISOString();

    } catch (error) {
      console.warn("Aviso: Linha com data inválida detectada. Usando data atual.");
      return new Date().toISOString();
    }
  }
}
