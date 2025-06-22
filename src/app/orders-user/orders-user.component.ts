import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BaseComponent } from '../components/base/base.component';
import { UserOrderResponse } from '../models/user-order';
import { ApiResponse } from '../responses/api.response';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-orders-user',
  imports: [CommonModule, RouterModule],
  templateUrl: './orders-user.component.html',
  styleUrl: './orders-user.component.scss',
  standalone: true
})
export class OrdersUserComponent extends BaseComponent implements OnInit {
  orders: UserOrderResponse[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    this.loadUserOrders();
  }
  loadUserOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const userId = this.tokenService.getUserId();
    console.log('User ID from token:', userId);
    
    if (!userId) {
      this.errorMessage = 'User not authenticated. Please login first.';
      this.isLoading = false;
      return;
    }

    console.log('Calling API:', `${environment.apiBaseUrl}/orders/user/${userId}`);
    
    this.orderService.getOrdersByUserId(userId).subscribe({
      next: (response: ApiResponse) => {
        if (response.status === 'OK') {
          this.orders = response.data || [];
          // Process thumbnail URLs and dates
          this.orders.forEach(order => {
            // Convert date strings to Date objects for proper display
            if (order.order_date && typeof order.order_date === 'string') {
              order.order_date = order.order_date;
            }
            
            order.order_details.forEach(detail => {
              if (detail.thumbnail && !detail.thumbnail.startsWith('http')) {
                detail.thumbnail = `${environment.apiBaseUrl}/products/images/${detail.thumbnail}`;
              }
            });
          });
        } else {
          this.errorMessage = response.message || 'Failed to load orders';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.errorMessage = 'Failed to load orders. Please try again.';
        this.isLoading = false;
      }
    });
  }

  getOrderStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'badge-warning';
      case 'processing':
        return 'badge-info';
      case 'shipped':
        return 'badge-primary';
      case 'delivered':
        return 'badge-success';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  viewOrderDetails(orderId: number): void {
    this.router.navigate(['/orders', orderId]);
  }
}
