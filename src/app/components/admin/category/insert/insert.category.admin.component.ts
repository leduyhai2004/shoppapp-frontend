import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OnInit } from '@angular/core';
import { InsertCategoryDTO } from '../../../../dtos/category/insert.category.dto';
import { Category } from '../../../../models/category';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseComponent } from '../../../base/base.component';

@Component({
    selector: 'app-insert.category.admin',
    templateUrl: './insert.category.admin.component.html',
    styleUrls: ['./insert.category.admin.component.scss'],
    imports: [
        CommonModule,
        FormsModule,
    ]
})
export class InsertCategoryAdminComponent extends BaseComponent implements OnInit {
  insertCategoryDTO: InsertCategoryDTO = {
    name: '',    
  };
  route: ActivatedRoute = inject(ActivatedRoute);  
  categories: Category[] = []; // Dữ liệu động từ categoryService  
  ngOnInit() {
    
  }   

  insertCategory() {    
    this.categoryService.insertCategory(this.insertCategoryDTO).subscribe({
      next: (response) => {
        debugger
        this.router.navigate(['/admin/categories']);        
      },
      error: (error: HttpErrorResponse) => {
        this.toastService.showToast({
          error: error,
          defaultMsg: 'Lỗi thêm danh mục mới',
          title: 'Lỗi Thêm Mới'
        });
      }       
    });    
  }
}
