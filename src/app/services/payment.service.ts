import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../responses/api.response';
import { CreatePaymentDTO } from '../dtos/payment/create.payment.dto';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiBaseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /** 
   * POST /payments/create_payment_url
   * Truyền vào một CreatePaymentDTO để tạo link thanh toán.
   */
  createPaymentUrl(paymentData: CreatePaymentDTO): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.apiBaseUrl}/payments/create_payment_url`,
      paymentData
    );
  }
}
