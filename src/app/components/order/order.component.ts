import { Component, OnInit, inject } from '@angular/core';
import { Product } from '../../models/product';
import { environment } from '../../../environments/environment';
import { OrderDTO } from '../../dtos/order/order.dto';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiResponse } from '../../responses/api.response';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseComponent } from '../base/base.component';

@Component({
    selector: 'app-order',
    templateUrl: './order.component.html',
    styleUrls: ['./order.component.scss'],
    imports: [
        FooterComponent,
        HeaderComponent,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
    ]
})
export class OrderComponent extends BaseComponent implements OnInit {
  private formBuilder = inject(FormBuilder);

  orderForm: FormGroup;
  cartItems: { product: Product, quantity: number }[] = [];
  totalAmount: number = 0;
  couponDiscount: number = 0;
  couponApplied: boolean = false;
  cart: Map<number, number> = new Map();

  // Mặc định payment_method = 'vnpay'
  orderData: OrderDTO = {
    user_id: 0,
    fullname: '',
    email: '',
    phone_number: '',
    address: '',
    status: 'pending',
    note: '',
    total_money: 0,
    payment_method: 'vnpay', // Đặt mặc định là thanh toán bằng VNPAY
    shipping_method: 'express',
    coupon_code: '',
    cart_items: []
  };

  constructor() {
    super();
    // Tạo FormGroup
    debugger
    this.orderForm = this.formBuilder.group({
      fullname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone_number: ['', [Validators.required, Validators.minLength(6)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      note: ['', Validators.required],
      couponCode: [''],
      shipping_method: ['express'],
      // Mặc định là 'vnpay'
      payment_method: ['vnpay']
    });
  }

  ngOnInit(): void {
    // Lấy userId
    this.orderData.user_id = this.tokenService.getUserId();
    this.orderForm.patchValue({...this.orderData,});    

    // Lấy giỏ hàng
    this.cart = this.cartService.getCart();
    const productIds = Array.from(this.cart.keys());

    if(productIds.length === 0) {
      return;
    }

    // Gọi service lấy thông tin sản phẩm
    this.productService.getProductsByIds(productIds).subscribe({
      next: (apiResponse: ApiResponse) => {
        const products: Product[] = apiResponse.data || [];
        // Gán cartItems
        this.cartItems = productIds.map((id) => {
          const product = products.find((p) => p.id === id);
          if (product) {
            product.thumbnail = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
          }
          return {
            product: product!,
            quantity: this.cart.get(id)!
          };
        });
      },
      complete: () => {
        this.calculateTotal();
      },
      error: (error: HttpErrorResponse) => {
        this.toastService.showToast({
          error: error,
          defaultMsg: 'Lỗi tải thông tin sản phẩm',
          title: 'Lỗi Giỏ Hàng'
        });
      }
    });
  }

  // Khi bấm nút "Đặt hàng"
  placeOrder() {
    debugger
    if (this.orderForm.valid) {
      // Gán giá trị form vào orderData
      this.orderData = {
        ...this.orderData,
        ...this.orderForm.value
      };
      // Gán cart_items
      this.orderData.cart_items = this.cartItems.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }));
      this.orderData.total_money = this.totalAmount;

      // Kiểm tra: Nếu payment_method = 'vnpay' => Gọi createPaymentUrl, 
      // ngược lại => placeOrder
      if (this.orderData.payment_method === 'vnpay') {
        debugger
        const amount = this.orderData.total_money || 0;
      
        // Bước 1: Gọi API tạo link thanh toán
        this.paymentService.createPaymentUrl({ amount, language: 'vn' })
          .subscribe({
            next: (res: ApiResponse) => {
              // res.data là URL thanh toán, ví dụ:
              // https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=49800&...&vnp_TxnRef=18425732&...
              const paymentUrl = res.data;
              console.log('URL thanh toán:', paymentUrl);              
              // Bước 2: Tách vnp_TxnRef từ URL vừa trả về
              const vnp_TxnRef = new URL(paymentUrl).searchParams.get('vnp_TxnRef') || '';
      
              // Bước 3: Gọi placeOrder kèm theo vnp_TxnRef
              this.orderService.placeOrder({
                ...this.orderData,
                vnp_txn_ref: vnp_TxnRef
              }).subscribe({
                next: (placeOrderResponse: ApiResponse) => {
                  // Bước 4: Nếu đặt hàng thành công, điều hướng sang trang thanh toán VNPAY
                  debugger
                  window.location.href = paymentUrl;
                },
                error: (err: HttpErrorResponse) => {
                  debugger
                  this.toastService.showToast({
                    error: err,
                    defaultMsg: 'Lỗi trong quá trình đặt hàng',
                    title: 'Lỗi Đặt Hàng'
                  });
                }
              });
            },
            error: (err: HttpErrorResponse) => {
              this.toastService.showToast({
                error: err,
                defaultMsg: 'Lỗi kết nối đến cổng thanh toán',
                title: 'Lỗi Thanh Toán'
              });
            }
          });
      } else {
        debugger
        // Chọn COD => Gọi this.orderService.placeOrder
        this.orderService.placeOrder(this.orderData).subscribe({
          next: (response: ApiResponse) => {
            debugger
            console.log('Đặt hàng COD thành công!', response);
            // Xoá giỏ hàng, về trang chủ
            this.cartService.clearCart();
            this.router.navigate(['/']);
          },
          error: (err: HttpErrorResponse) => {
            debugger
            this.toastService.showToast({
              error: err,
              defaultMsg: 'Lỗi trong quá trình đặt hàng',
              title: 'Lỗi Đặt Hàng'
            });
          }
        });
      }

    } else {
      this.toastService.showToast({
        error: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        defaultMsg: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        title: 'Lỗi Dữ Liệu'
      });
      this.orderForm.markAllAsTouched();
    }
  }

  // Giảm số lượng
  decreaseQuantity(index: number): void {
    if (this.cartItems[index].quantity > 1) {
      this.cartItems[index].quantity--;
      this.updateCartFromCartItems();
      this.calculateTotal();
    }
  }

  // Tăng số lượng
  increaseQuantity(index: number): void {
    this.cartItems[index].quantity++;
    this.updateCartFromCartItems();
    this.calculateTotal();
  }

  calculateTotal(): void {
    this.totalAmount = this.cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }

  confirmDelete(index: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      this.cartItems.splice(index, 1);
      this.updateCartFromCartItems();
      this.calculateTotal();
    }
  }

  applyCoupon(): void {
    const couponCode = this.orderForm.get('couponCode')!.value;
    if (!this.couponApplied && couponCode) {
      this.calculateTotal();
      this.couponService.calculateCouponValue(couponCode, this.totalAmount)
        .subscribe({
          next: (apiResponse: ApiResponse) => {
            this.totalAmount = apiResponse.data;
            this.couponApplied = true;
          },
          error: (error) => {
            this.toastService.showToast({
              error: error,
              defaultMsg: 'Mã giảm giá không hợp lệ',
              title: 'Lỗi Coupon'
            });
          }
        });
    }
  }

  private updateCartFromCartItems(): void {
    this.cart.clear();
    this.cartItems.forEach(item => {
      this.cart.set(item.product.id, item.quantity);
    });
    this.cartService.setCart(this.cart);
  }
}
