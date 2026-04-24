import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';
import { forkJoin, map, Subject, BehaviorSubject, takeUntil, startWith } from 'rxjs';
import { DataService } from '../../services/data.service';
import { Funcionario } from '../../models/funcionario.model';
import { Historico, HistoricoFormatado } from '../../models/historico.model';


import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-historico-completo',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatSelectModule, MatDatepickerModule, MatInputModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './historico-completo.component.html',
  styleUrls: ['./historico-completo.component.scss']
})
export class HistoricoCompletoComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['item', 'funcionario', 'dataInicio', 'dataFim'];
  
  funcionarios: Funcionario[] = [];
  private historicoCompleto: HistoricoFormatado[] = [];
  historicoFiltrado$ = new BehaviorSubject<HistoricoFormatado[]>([]);
  
  filterForm!: FormGroup;
  private destroy$ = new Subject<void>();
  private dadosAtuaisNaTabela: HistoricoFormatado[] = [];
  private logoBase64: string | null = null;

  datepickerStartView: 'month' | 'year' | 'multi-year' = 'month';

  @ViewChild('picker') datepicker!: MatDatepicker<Date>;

  constructor(
    private dataService: DataService,
    private fb: FormBuilder,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      funcionarioId: [null],
      filterType: ['day'],
      data: [null]
    });

    this.carregarDadosIniciais();
    this.carregarLogo();

    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.aplicarFiltros();
    });

    this.filterForm.get('filterType')?.valueChanges.pipe(
      startWith('day'),
      takeUntil(this.destroy$)
    ).subscribe(type => {
      this.datepickerStartView = (type === 'month' || type === 'year') ? 'multi-year' : 'month';
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarLogo(): void {
    const logoPath = '../../../assets/Elo_TI.png';
    this.http.get(logoPath, { responseType: 'blob' }).subscribe(blob => {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.logoBase64 = reader.result as string;
      };
      reader.readAsDataURL(blob);
    });
  }

  private carregarDadosIniciais(): void {
    forkJoin({
      historico: this.dataService.getHistoricoCompleto(),
      itens: this.dataService.fetchAndNotifyItens(),
      funcionarios: this.dataService.getFuncionarios()
    }).pipe(
      map(({ historico, itens, funcionarios }) => {
        this.funcionarios = funcionarios;
        const itemMap = new Map(itens.map(i => [i.id, i.nomeDoItem]));
        const funcMap = new Map(funcionarios.map(f => [f.id, f.nome]));

        const formattedData = historico.map(h => ({
          nomeItem: itemMap.get(h.itemId) || 'Item desconhecido',
          nomeFuncionario: funcMap.get(h.funcionarioId) || 'Funcionário desconhecido',
          funcionarioId: h.funcionarioId,
          dataInicio: h.dataInicio,
          dataFim: h.dataFim
        }));
        
        formattedData.sort((a, b) => {
          const dateA = new Date(a.dataFim || a.dataInicio).getTime();
          const dateB = new Date(b.dataFim || b.dataInicio).getTime();
          return dateB - dateA;
        });

        return formattedData;
      })
    ).subscribe(data => {
      this.historicoCompleto = data;
      this.aplicarFiltros();
    });
  }

  private aplicarFiltros(): void {
    const { funcionarioId, filterType, data } = this.filterForm.value;
    let dadosFiltrados = [...this.historicoCompleto];

    if (funcionarioId) {
      dadosFiltrados = dadosFiltrados.filter(h => h.funcionarioId === funcionarioId);
    }

    if (data) {
      const dataFiltro = new Date(data);
      dadosFiltrados = dadosFiltrados.filter(h => {
        const dataEvento = new Date(h.dataFim || h.dataInicio);
        switch (filterType) {
          case 'day': return dataEvento.toDateString() === dataFiltro.toDateString();
          case 'month': return dataEvento.getMonth() === dataFiltro.getMonth() && dataEvento.getFullYear() === dataFiltro.getFullYear();
          case 'year': return dataEvento.getFullYear() === dataFiltro.getFullYear();
          default: return true;
        }
      });
    }
    this.dadosAtuaisNaTabela = dadosFiltrados;
    this.historicoFiltrado$.next(dadosFiltrados);
  }

  monthSelectedHandler(normalizedMonth: Date, datepicker: MatDatepicker<Date>) {
    if (this.filterForm.get('filterType')?.value === 'month') {
      this.filterForm.get('data')?.setValue(normalizedMonth);
      datepicker.close();
    }
  }

  yearSelectedHandler(normalizedYear: Date, datepicker: MatDatepicker<Date>) {
    if (this.filterForm.get('filterType')?.value === 'year') {
      this.filterForm.get('data')?.setValue(normalizedYear);
      datepicker.close();
    }
  }

  limparFiltros(): void {
    this.filterForm.reset({ 
      filterType: 'day', 
      funcionarioId: null, 
      data: null 
    });
  }

  gerarPDF(): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    if (this.logoBase64) {
      doc.addImage(this.logoBase64, 'PNG', 14, 8, 50, 0);
    }
    
    doc.setFontSize(16);
    doc.text('Histórico de Atividades', pageWidth / 2, 35, { align: 'center' });
    
    doc.setFontSize(10);
    
    autoTable(doc, {
      startY: 40, 
      head: [['Item', 'Atribuído para', 'Data de Início', 'Data de Devolução']],
      body: this.dadosAtuaisNaTabela.map(h => [
        h.nomeItem,
        h.nomeFuncionario,
        new Date(h.dataInicio).toLocaleDateString('pt-BR'),
        h.dataFim ? new Date(h.dataFim).toLocaleDateString('pt-BR') : 'Em uso'
      ]),
      theme: 'grid'
    });

    doc.save('historico-elo_ti.pdf');
  }
}

