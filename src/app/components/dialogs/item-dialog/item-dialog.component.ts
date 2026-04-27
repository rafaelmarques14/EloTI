import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { Item } from '../../../models/item.model';
import { Funcionario } from '../../../models/funcionario.model';
import { DataService } from '../../../services/data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-item-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './item-dialog.component.html',
  styleUrls: ['./item-dialog.component.css']
})
export class ItemDialogComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  isEditMode: boolean;
  statuses: ('Livre' | 'Em uso' | 'Manutenção')[] = ['Livre', 'Em uso', 'Manutenção'];
  funcionarios: Funcionario[] = [];
  statusChangesSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private dialogRef: MatDialogRef<ItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item: Item | null, funcionarios: Funcionario[] }
  ) {
    this.isEditMode = !!this.data.item;
    this.funcionarios = this.data.funcionarios;
  }

  ngOnInit(): void {
    const currentItem = this.data.item;

    this.form = this.fb.group({
      nomeDoItem: [currentItem?.nomeDoItem || '', Validators.required],
      marca: [currentItem?.marca || '', Validators.required],
      modelo: [currentItem?.modelo || '', Validators.required],
      numeroDeTombamento: [currentItem?.numeroDeTombamento || '', Validators.required],
      status: [currentItem?.status || 'Livre', Validators.required],
      funcionarioId: [currentItem?.funcionarioId || null]
    });

    this.handleStatusChange();
    const statusControl = this.form.get('status');
    if (statusControl) {
      this.statusChangesSubscription = statusControl.valueChanges.subscribe(() => {
        this.handleStatusChange();
      });
    }
  }

  handleStatusChange(): void {
    const statusControl = this.form.get('status');
    const funcionarioControl = this.form.get('funcionarioId');

    if (statusControl && funcionarioControl) {
      if (statusControl.value === 'Em uso') {
        funcionarioControl.setValidators(Validators.required);
      } else {
        funcionarioControl.clearValidators();
        funcionarioControl.setValue(null);
      }
      funcionarioControl.updateValueAndValidity();
    }
  }

  save(): void {
    if (this.form.invalid) return;

    const formData = this.form.value;

    if (this.isEditMode && this.data.item) {
      const original = this.data.item;
      const updatedItem: Item = { ...original, ...formData };

      if (original.status !== 'Em uso' && formData.status === 'Em uso') {
        this.dataService.updateItem(updatedItem).subscribe(() => {
          this.dataService.atribuirItem(updatedItem.id, formData.funcionarioId).subscribe(() => {
            this.dialogRef.close(true);
          });
        });
      }

      else if (original.status === 'Em uso' && formData.status === 'Em uso' && original.funcionarioId !== formData.funcionarioId) {

        this.dataService.desatribuirItem(original).subscribe(() => {
          this.dataService.updateItem(updatedItem).subscribe(() => {
            // Cria histórico com o novo funcionário
            this.dataService.atribuirItem(updatedItem.id, formData.funcionarioId).subscribe(() => {
              this.dialogRef.close(true);
            });
          });
        });
      }

      else if (original.status === 'Em uso' && formData.status !== 'Em uso') {
        this.dataService.desatribuirItem(original).subscribe(() => {
          updatedItem.historicoIdAtivo = null;
          updatedItem.funcionarioId = null;
          this.dataService.updateItem(updatedItem).subscribe(() => {
            this.dialogRef.close(true);
          });
        });
      }

      else {
        this.dataService.updateItem(updatedItem).subscribe(() => {
          this.dialogRef.close(true);
        });
      }

    } else {

      const newItem = { ...formData };
      this.dataService.addItem(newItem).subscribe(() => {
        this.dialogRef.close(true);
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    if (this.statusChangesSubscription) {
      this.statusChangesSubscription.unsubscribe();
    }
  }
}
