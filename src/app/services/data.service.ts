import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { Item } from '../models/item.model';
import { Funcionario } from '../models/funcionario.model';
import { Historico } from '../models/historico.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private itens$ = new BehaviorSubject<Item[]>([]);

  private itensData: Item[] = [];
  private funcionariosData: Funcionario[] = [];
  private historicoData: Historico[] = [];

  constructor() { 
    this.loadFromLocalStorage();
  }


  private loadFromLocalStorage(): void {
    const savedItens = localStorage.getItem('db_itens');
    const savedFuncionarios = localStorage.getItem('db_funcionarios');
    const savedHistorico = localStorage.getItem('db_historico');

    if (savedItens && savedFuncionarios && savedHistorico) {
      this.itensData = JSON.parse(savedItens);
      this.funcionariosData = JSON.parse(savedFuncionarios);
      this.historicoData = JSON.parse(savedHistorico);
    } else {
      this.seedInitialData();
    }

    this.itens$.next([...this.itensData]);
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('db_itens', JSON.stringify(this.itensData));
    localStorage.setItem('db_funcionarios', JSON.stringify(this.funcionariosData));
    localStorage.setItem('db_historico', JSON.stringify(this.historicoData));
    
    this.itens$.next([...this.itensData]);
  }

  private generateId(collection: any[]): number {
    return collection.length > 0 ? Math.max(...collection.map(i => i.id || 0)) + 1 : 1;
  }

  getItensState(): Observable<Item[]> {
    return this.itens$.asObservable();
  }

  fetchAndNotifyItens(): Observable<Item[]> {
    this.itens$.next([...this.itensData]);
    return of([...this.itensData]);
  }

  getHistoricoRecente(): Observable<Historico[]> {
    const ordenado = [...this.historicoData].sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
    return of(ordenado.slice(0, 30));
  }

  getHistoricoCompleto(): Observable<Historico[]> {
    const ordenado = [...this.historicoData].sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());
    return of(ordenado);
  }

  getFuncionarios(): Observable<Funcionario[]> {
    return of([...this.funcionariosData]);
  }

  atribuirItem(itemId: number, funcionarioId: number): Observable<any> {
    const novoIdHistorico = this.generateId(this.historicoData);
    
    const novoHistorico: Historico = {
      id: novoIdHistorico,
      itemId: itemId,
      funcionarioId: funcionarioId,
      dataInicio: new Date().toISOString(),
      dataFim: null
    };
    this.historicoData.push(novoHistorico);

    const itemIndex = this.itensData.findIndex(i => i.id === itemId);
    if (itemIndex !== -1) {
      this.itensData[itemIndex] = {
        ...this.itensData[itemIndex],
        funcionarioId: funcionarioId,
        status: 'Em uso',
        historicoIdAtivo: novoIdHistorico
      };
    }

    this.saveToLocalStorage();
    return of(this.itensData[itemIndex]);
  }

  desatribuirItem(item: Item): Observable<any> {
    const historicoIndex = this.historicoData.findIndex(h => h.id === item.historicoIdAtivo);
    if (historicoIndex !== -1) {
      this.historicoData[historicoIndex].dataFim = new Date().toISOString();
    }

    const itemIndex = this.itensData.findIndex(i => i.id === item.id);
    if (itemIndex !== -1) {
      this.itensData[itemIndex] = {
        ...this.itensData[itemIndex],
        funcionarioId: null,
        status: 'Livre',
        historicoIdAtivo: null
      };
    }

    this.saveToLocalStorage();
    return of(this.itensData[itemIndex]);
  }

  addItem(item: Omit<Item, 'id'>): Observable<Item> {
    const novoItem = { ...item, id: this.generateId(this.itensData) } as Item;
    this.itensData.push(novoItem);
    this.saveToLocalStorage();
    return of(novoItem);
  }

  updateItem(item: Item): Observable<Item> {
    const index = this.itensData.findIndex(i => i.id === item.id);
    if (index !== -1) {
      this.itensData[index] = item;
      this.saveToLocalStorage();
    }
    return of(item);
  }

  deleteItem(id: number): Observable<any> {
    this.itensData = this.itensData.filter(i => i.id !== id);
    this.saveToLocalStorage();
    return of({ success: true });
  }

  addFuncionario(funcionario: Omit<Funcionario, 'id'>): Observable<Funcionario> {
    const novoFunc = { ...funcionario, id: this.generateId(this.funcionariosData) } as Funcionario;
    this.funcionariosData.push(novoFunc);
    this.saveToLocalStorage();
    return of(novoFunc);
  }

  updateFuncionario(funcionario: Funcionario): Observable<Funcionario> {
    const index = this.funcionariosData.findIndex(f => f.id === funcionario.id);
    if (index !== -1) {
      this.funcionariosData[index] = funcionario;
      this.saveToLocalStorage();
    }
    return of(funcionario);
  }

  deleteFuncionario(id: number): Observable<any> {
    this.funcionariosData = this.funcionariosData.filter(f => f.id !== id);
    this.saveToLocalStorage();
    return of({ success: true });
  }

  private seedInitialData(): void {
    this.funcionariosData = [
      { id: 1, nome: "Rafael Marques", cpf: "12345678900", dataNascimento: "2000-10-25T02:00:00.000Z" },
      { id: 2, nome: "Laércio Rodrigues", cpf: "23456789021", dataNascimento: "2002-03-08T03:00:00.000Z" },
      { id: 3, nome: "Vinicius D'Amorim", cpf: "22233344455", dataNascimento: "1999-09-30T03:00:00.000Z" }
    ];

    this.itensData = [
      { id: 1, nomeDoItem: "Notebook Dell Latitude", marca: "Dell", modelo: "Latitude 5420", numeroDeTombamento: "DELL-001", status: "Em uso", funcionarioId: 2, historicoIdAtivo: 1 },
      { id: 2, nomeDoItem: "Notebook Dell Inspiron", marca: "Dell", modelo: "Inspiron 14", numeroDeTombamento: "DELL-002", status: "Em uso", funcionarioId: 1, historicoIdAtivo: 2 },
      { id: 3, nomeDoItem: "Monitor AOC", marca: "AOC", modelo: "4K", numeroDeTombamento: "AOC-729", status: "Livre", funcionarioId: null, historicoIdAtivo: null }
    ];

    this.historicoData = [
      { id: 1, itemId: 1, funcionarioId: 2, dataInicio: "2025-10-06T23:01:41.747Z", dataFim: null },
      { id: 2, itemId: 2, funcionarioId: 1, dataInicio: "2025-10-06T23:01:45.394Z", dataFim: null }
    ];
    
    this.saveToLocalStorage();
  }
}
