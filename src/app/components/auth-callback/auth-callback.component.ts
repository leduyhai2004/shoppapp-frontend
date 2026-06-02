import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent } from '../base/base.component';
import { ApiResponse } from '../../responses/api.response';
import { tap, switchMap } from 'rxjs/operators';
import { UserResponse } from '../../responses/user/user.response';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-auth-callback',
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.scss'],
  imports: [
    // FooterComponent,
    // HeaderComponent,
    CommonModule
  ]
})

export class AuthCallbackComponent extends BaseComponent implements OnInit {
  userResponse?: UserResponse
  ngOnInit() {
    //Config: OAuth consent screen in Google Console
    //Config: OAuth Client ID in Google Console
    const browserWindow = this.document.defaultView;
    if (!browserWindow) {
      return;
    }

    const url = this.router.url;
    let loginType: 'google' | 'facebook';
    if (url.includes('/auth/google/callback')) {
      loginType = 'google';
    } else if (url.includes('/auth/facebook/callback')) {
      loginType = 'facebook';
    } else {
      console.error('Không xác định được nhà cung cấp xác thực.');
      return;
    }
    const code = this.activatedRoute.snapshot.queryParamMap.get('code');
    if (!code) {
      this.toastService.showToast({
        error: null,
        defaultMsg: 'Lỗi hệ thống xác thực',
        title: 'Lỗi Đăng Nhập'
      });
      return;
    }

    const callbackKey = `oauth_callback_${loginType}_${code}`;
    if (browserWindow.sessionStorage.getItem(callbackKey)) {
      this.location.replaceState(url.split('?')[0]);
      return;
    }
    browserWindow.sessionStorage.setItem(callbackKey, 'processing');
    this.location.replaceState(url.split('?')[0]);

    // Gửi mã này đến server để lấy token. OAuth code chỉ được dùng một lần.
    this.authService.exchangeCodeForToken(code, loginType).pipe(
      tap((response: ApiResponse) => {
        const token = response.data.token;
        this.tokenService.setToken(token);
      }),
      switchMap((response) => {
        const token = response.data.token;
        return this.userService.getUserDetail(token);
      })
    ).subscribe({
      next: (apiResponse: ApiResponse) => {
        this.userResponse = {
          ...apiResponse.data,
          date_of_birth: new Date(apiResponse.data.date_of_birth),
        };
        this.userService.saveUserResponseToLocalStorage(this.userResponse);

        if (this.userResponse?.role.name === 'admin') {
          this.router.navigate(['/admin']);
        } else if (this.userResponse?.role.name === 'user') {
          this.router.navigate(['/']);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.toastService.showToast({
          error: error,
          defaultMsg: 'Lỗi xác thực tài khoản',
          title: 'Lỗi Đăng Nhập'
        });
      },
      complete: () => {
        this.cartService.refreshCart();
      }
    });
  }
}
