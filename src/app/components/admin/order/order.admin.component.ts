import { Component, OnInit, Inject } from '@angular/core';
import { OrderResponse } from '../../../responses/order/order.response';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiResponse } from '../../../responses/api.response';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseComponent } from '../../base/base.component';

@Component({
  selector: 'app-order-admin',
  templateUrl: './order.admin.component.html',
  styleUrls: ['./order.admin.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
  ]
})
export class OrderAdminComponent extends BaseComponent implements OnInit {
  orders: OrderResponse[] = [];
  currentPage: number = 0;
  itemsPerPage: number = 12;
  pages: number[] = [];
  totalPages: number = 0;
  keyword: string = "";
  visiblePages: number[] = [];
  localStorage?: Storage;

  constructor() {
    super();
    this.localStorage = document.defaultView?.localStorage;
  }

  ngOnInit(): void {

    this.currentPage = Number(this.localStorage?.getItem('currentOrderAdminPage')) || 0;
    this.getAllOrders(this.keyword, this.currentPage, this.itemsPerPage);
  }
  searchOrders() {
    this.currentPage = 0;
    this.itemsPerPage = 12;
    //Mediocre Iron Wallet

    this.getAllOrders(this.keyword.trim(), this.currentPage, this.itemsPerPage);
  }
  getAllOrders(keyword: string, page: number, limit: number) {

    this.orderService.getAllOrders(keyword, page, limit).subscribe({
      next: (apiResponse: ApiResponse) => {

        this.orders = apiResponse.data.orders;
        this.totalPages = apiResponse.data.totalPages;
        this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);
      },
      complete: () => {

      },
      error: (error: HttpErrorResponse) => {
        this.toastService.showToast({
          error: error,
          defaultMsg: 'Lỗi tải danh sách đơn hàng',
          title: 'Lỗi Tải Dữ Liệu'
        });
      }
    });
  }
  onPageChange(page: number) {

    this.currentPage = page < 0 ? 0 : page;
    this.localStorage?.setItem('currentOrderAdminPage', String(this.currentPage));
    this.getAllOrders(this.keyword, this.currentPage, this.itemsPerPage);
  }


  deleteOrder(id: number) {
    const confirmation = window
      .confirm('Are you sure you want to delete this order?');
    if (confirmation) {

      this.orderService.deleteOrder(id).subscribe({
        next: (response: ApiResponse) => {
          this.toastService.showToast({
            error: null,
            defaultMsg: 'Xóa đơn hàng thành công',
            title: 'Thành Công'
          });
          location.reload();
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.showToast({
            error: error,
            defaultMsg: 'Lỗi khi xóa đơn hàng',
            title: 'Lỗi Xóa'
          });
        },
        complete: () => {

        },
      });
    }
  }
  viewDetails(order: OrderResponse) {

    this.router.navigate(['/admin/orders', order.id]);
  }

}