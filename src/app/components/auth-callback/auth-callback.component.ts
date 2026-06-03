import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BaseComponent } from '../base/base.component';
import { ApiResponse } from '../../responses/api.response';
import { UserResponse } from '../../responses/user/user.response';
import { SocialLoginProvider } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { tap, switchMap, finalize } from 'rxjs/operators';

/** Trạng thái của trang callback */
type CallbackState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-auth-callback',
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.scss'],
  imports: [CommonModule, RouterModule]
})
export class AuthCallbackComponent extends BaseComponent implements OnInit {
  /** Trạng thái hiện tại */
  state: CallbackState = 'loading';

  /** Thông báo lỗi hiển thị cho user */
  errorMessage = '';

  /** Flag chống xử lý callback trùng lặp */
  private isProcessing = false;

  ngOnInit(): void {
    this.handleOAuthCallback();
  }

  /**
   * Xử lý OAuth callback: xác định provider, lấy code, exchange token.
   */
  private handleOAuthCallback(): void {
    // Guard: chống duplicate processing
    if (this.isProcessing) return;
    this.isProcessing = true;

    // Step 1: Xác định provider từ URL
    const provider = this.detectProvider();
    if (!provider) {
      this.showError('Không xác định được nhà cung cấp xác thực.');
      return;
    }

    // Step 2: Lấy authorization code từ query params
    const code = this.activatedRoute.snapshot.queryParamMap.get('code');
    if (!code) {
      this.showError('Không nhận được mã xác thực từ nhà cung cấp.');
      return;
    }

    // Step 3: Xóa code khỏi URL để tránh re-use
    this.cleanUrl();

    // Step 4: Exchange code lấy JWT token và xử lý đăng nhập
    this.processLogin(code, provider);
  }

  /**
   * Xác định OAuth provider dựa trên URL hiện tại.
   */
  private detectProvider(): SocialLoginProvider | null {
    const url = this.router.url;
    if (url.includes('/auth/google/callback')) return 'google';
    if (url.includes('/auth/facebook/callback')) return 'facebook';
    return null;
  }

  /**
   * Xóa query params khỏi URL (giữ path gốc).
   */
  private cleanUrl(): void {
    const url = this.router.url;
    this.location.replaceState(url.split('?')[0]);
  }

  /**
   * Gửi code đến backend, lưu token, lấy user detail, và navigate.
   */
  private processLogin(code: string, provider: SocialLoginProvider): void {
    this.authService.exchangeCodeForToken(code, provider).pipe(
      // Lưu JWT token
      tap((response: ApiResponse) => {
        this.tokenService.setToken(response.data.token);
      }),
      // Lấy thông tin chi tiết user
      switchMap((response: ApiResponse) => {
        return this.userService.getUserDetail(response.data.token);
      }),
      finalize(() => {
        this.isProcessing = false;
      })
    ).subscribe({
      next: (apiResponse: ApiResponse) => {
        this.handleLoginSuccess(apiResponse);
      },
      error: (error: HttpErrorResponse) => {
        this.handleLoginError(error);
      }
    });
  }

  /**
   * Xử lý khi đăng nhập thành công: lưu user info và navigate.
   */
  private handleLoginSuccess(apiResponse: ApiResponse): void {
    const userResponse: UserResponse = {
      ...apiResponse.data,
      date_of_birth: new Date(apiResponse.data.date_of_birth),
    };

    this.userService.saveUserResponseToLocalStorage(userResponse);
    this.cartService.refreshCart();
    this.state = 'success';

    // Navigate dựa theo role
    const targetRoute = userResponse.role?.name === 'admin' ? '/admin' : '/';
    this.router.navigate([targetRoute]);
  }

  /**
   * Xử lý khi đăng nhập thất bại.
   */
  private handleLoginError(error: HttpErrorResponse): void {
    const message = error?.error?.message || 'Đã xảy ra lỗi khi xác thực tài khoản.';
    this.showError(message);

    this.toastService.showToast({
      error: error,
      defaultMsg: 'Lỗi xác thực tài khoản',
      title: 'Lỗi Đăng Nhập'
    });
  }

  /**
   * Cập nhật trạng thái lỗi.
   */
  private showError(message: string): void {
    this.state = 'error';
    this.errorMessage = message;
    this.isProcessing = false;
  }

  /**
   * Thử lại: redirect về trang login.
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
