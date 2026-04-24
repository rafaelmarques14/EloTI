import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from '../../services/data.service';
import { Item } from '../../models/item.model';
import { ActivityFeedComponent } from '../activity-feed/activity-feed.component';
import { ItemListComponent } from '../item-list/item-list.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    ActivityFeedComponent,
    ItemListComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  itens: Item[] = [];
  totalItens = 0;
  totalLivre = 0;
  totalEmUso = 0;
  totalManutencao = 0;

  constructor(private dataService: DataService) { }

  ngOnInit(): void {

    this.dataService.getItensState().subscribe(data => {
      this.itens = data;
      this.calculateStats();
    });


    this.dataService.fetchAndNotifyItens().subscribe();
  }

  calculateStats(): void {
    this.totalItens = this.itens.length;
    this.totalLivre = this.itens.filter(i => i.status === 'Livre').length;
    this.totalEmUso = this.itens.filter(i => i.status === 'Em uso').length;
    this.totalManutencao = this.itens.filter(i => i.status === 'Manutenção').length;
  }
}
