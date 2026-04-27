import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';

import { DataService } from '../../services/data.service';
import { Item } from '../../models/item.model';
import { Funcionario } from '../../models/funcionario.model';
import { ItemDialogComponent } from '../dialogs/item-dialog/item-dialog.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatAutocompleteModule, 
    MatInputModule        
  ],
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.css']
})
export class ItemListComponent implements OnInit {
  displayedColumns: string[] = ['item', 'tombamento', 'status', 'atribuidoPara', 'acoes'];
  
  todosItens: Item[] = []; 
  itens: Item[] = [];      
  
  statusFiltro: string = 'Todos';
  tombamentoFiltro: string = '';
  
  funcionarios: Funcionario[] = [];
  funcionariosFiltrados: Funcionario[] = [];
  funcionarioMap = new Map<any, string>();

  constructor(
    private dataService: DataService,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.carregarItens();

    this.dataService.getFuncionarios().subscribe(data => {
      this.funcionarios = data;
      this.funcionariosFiltrados = data;
      this.funcionarios.forEach(f => this.funcionarioMap.set(f.id, f.nome));
    });
  }

  carregarItens(): void {
    this.dataService.getItensState().subscribe(dataItens => {
      this.todosItens = dataItens;
      this.aplicarFiltros();
    });
  }

  onFiltroChange(novoStatus: string): void {
    this.statusFiltro = novoStatus;
    this.aplicarFiltros();
  }

  onTombamentoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.tombamentoFiltro = input.value;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let filtrados = [...this.todosItens];

    if (this.statusFiltro !== 'Todos') {
      filtrados = filtrados.filter(item => item.status === this.statusFiltro);
    }

    if (this.tombamentoFiltro.trim() !== '') {
      const termoBusca = this.tombamentoFiltro.toLowerCase().trim();
      filtrados = filtrados.filter(item => 
        item.numeroDeTombamento.toLowerCase().includes(termoBusca)
      );
    }

    this.itens = filtrados;
  }


  resetarFiltro(): void {
    this.funcionariosFiltrados = [...this.funcionarios];
  }

  filtrarFuncionarios(event: any): void {
    const valorDigitado = event.target.value.toLowerCase();
    this.funcionariosFiltrados = this.funcionarios.filter(f =>
      f.nome.toLowerCase().includes(valorDigitado)
    );
  }

  displayFuncionario(id: any): string {
    return id ? (this.funcionarioMap.get(id) || '') : '';
  }


  openItemDialog(item?: Item): void {
    const dialogRef = this.dialog.open(ItemDialogComponent, {
      width: '450px',
      data: { 
        item: item ? { ...item } : null, 
        funcionarios: this.funcionarios 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.carregarItens();
      }
    });
  }

  deleteItem(item: Item): void {
    if (confirm(`Tem certeza que deseja excluir o item "${item.nomeDoItem}"?`)) {
      this.dataService.deleteItem(item.id).subscribe();
    }
  }

  onFuncionarioSelect(item: Item, funcionarioId: any): void {
    if (funcionarioId) {
      this.dataService.atribuirItem(item.id, funcionarioId).subscribe(() => {
        this.carregarItens();
      });
    }
  }
  
  desatribuirItem(item: Item): void {
    if (confirm(`Tem certeza que deseja desatribuir "${item.nomeDoItem}"?`)) {
      this.dataService.desatribuirItem(item).subscribe(() => {
         this.carregarItens();
      });
    }
  }
  
  getFuncionarioNome(id: any): string {
    return id ? this.funcionarioMap.get(id) || 'Não encontrado' : '-';
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'Livre': return 'status-livre';
      case 'Em uso': return 'status-em-uso';
      case 'Manutenção': return 'status-manutencao';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Livre': return 'check_circle';
      case 'Em uso': return 'person_pin';
      case 'Manutenção': return 'build';
      default: return '';
    }
  }

  exportarExcel(): void {
    const dadosParaExportar = this.todosItens.map(item => ({
      'Equipamento': item.nomeDoItem,
      'Marca': item.marca,
      'Modelo': item.modelo,
      'Tombamento': item.numeroDeTombamento,
      'Status': item.status,
      'Atribuído Para': item.status === 'Em uso' ? this.getFuncionarioNome(item.funcionarioId) : '-'
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dadosParaExportar);
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 }];
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Itens');
    XLSX.writeFile(wb, 'relatorio_itens_elo_ti.xlsx');
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

        const tombamentosRegistrados = new Set(this.todosItens.map(i => i.numeroDeTombamento));

        data.forEach((row: any) => {
          const nomeLido = row['Monitor AOC'] || row['Equipamento'] || row['Item'] || row['Nome'];
          const marcaLida = row['AOC'] || row['Marca'] || '';
          const modeloLido = row['4K'] || row['Modelo'] || '';
          const tombamentoLido = row['AOC-729'] || row['Tombamento'] || row['Patrimônio'] || '';
          const statusLido = row['Em uso'] || row['Status'] || 'Livre';
          const nomeFuncionarioLido = row['Rafael Marques'] || row['Atribuído Para'] || row['Funcionario'] || row['Funcionário'];

          if (nomeLido && tombamentoLido) {
            const tombamentoLimpo = String(tombamentoLido).trim();

            if (tombamentosRegistrados.has(tombamentoLimpo)) {
              ignorados++;
            } else {
              tombamentosRegistrados.add(tombamentoLimpo);
              const statusFinal = (statusLido === 'Em uso' || statusLido === 'Manutenção') ? statusLido : 'Livre';

              let funcionarioIdEncontrado: any = null;
              if (statusFinal === 'Em uso' && nomeFuncionarioLido) {
                const nomeBusca = String(nomeFuncionarioLido).trim().toLowerCase();
                const func = this.funcionarios.find(f => f.nome.toLowerCase() === nomeBusca);
                if (func) {
                  funcionarioIdEncontrado = func.id;
                }
              }

              const novoItem: Omit<Item, 'id'> = {
                nomeDoItem: String(nomeLido).trim(),
                marca: String(marcaLida).trim(),
                modelo: String(modeloLido).trim(),
                numeroDeTombamento: tombamentoLimpo,
                status: statusFinal,
                funcionarioId: funcionarioIdEncontrado,
                historicoIdAtivo: null
              };

              this.dataService.addItem(novoItem).subscribe();
              importados++;
            }
          }
        });

        this.carregarItens();
        
        let mensagem = `${importados} itens foram importados com sucesso!`;
        if (ignorados > 0) {
          mensagem += `\n${ignorados} itens foram ignorados pois já possuíam o mesmo número de tombamento no sistema.`;
        }
        alert(mensagem);
        
        event.target.value = ''; 

      } catch (error) {
        console.error("Erro detalhado ao ler a planilha:", error);
        alert("Ocorreu um erro ao ler o arquivo. Aperte F12 e olhe a aba 'Console'.");
        event.target.value = '';
      }
    };

    reader.readAsArrayBuffer(target.files[0]);
  }
}
