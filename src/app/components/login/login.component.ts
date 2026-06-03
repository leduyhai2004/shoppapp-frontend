import { Component, ViewChild, OnInit } from '@angular/core';
import { LoginDTO } from '../../dtos/user/login.dto';
import { NgForm } from '@angular/forms';
import { Role } from '../../models/role';
import { UserResponse } from '../../responses/user/user.response';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiResponse } from '../../responses/api.response';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseComponent } from '../base/base.component';
import { SocialLoginProvider } from '../../services/auth.service';
import { tap, switchMap, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    FooterComponent,
    HeaderComponent,
    CommonModule,
    FormsModule
  ]
})
export class LoginComponent extends BaseComponent implements OnInit {
  @ViewChild('loginForm') loginForm!: NgForm;

  phoneNumber = '33445566';
  password = '123456789';
  showPassword = false;
  roles: Role[] = [];
  rememberMe = true;
  selectedRole: Role | undefined;
  userResponse?: UserResponse;

  /** Trạng thái loading cho social login buttons */
  isSocialLoading = false;

  ngOnInit(): void {
    this.loadRoles();
  }

  // ==================== Navigation ====================

  createAccount(): void {
    this.router.navigate(['/register']);
  }

  // ==================== Traditional Login ====================

  onPhoneNumberChange(): void {
    console.log(`Phone typed: ${this.phoneNumber}`);
  }

  login(): void {
    const loginDTO: LoginDTO = {
      phone_number: this.phoneNumber,
      password: this.password,
      role_id: this.selectedRole?.id ?? 1
    };

    this.userService.login(loginDTO).pipe(
      tap((apiResponse: ApiResponse) => {
        this.tokenService.setToken(apiResponse.data.token);
      }),
      switchMap((apiResponse: ApiResponse) => {
        return this.userService.getUserDetail(apiResponse.data.token).pipe(
          tap((detailResponse: ApiResponse) => {
            this.handlePostLogin(detailResponse);
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('Lỗi khi lấy thông tin người dùng:', error?.error?.message ?? '');
            return of(null);
          })
        );
      }),
      finalize(() => {
        this.cartService.refreshCart();
      })
    ).subscribe({
      error: (error: HttpErrorResponse) => {
        this.toastService.showToast({
          error: error,
          defaultMsg: 'Sai thông tin đăng nhập',
          title: 'Lỗi Đăng Nhập'
        });
      }
    });
  }

  // ==================== Social Login ====================

  loginWithGoogle(): void {
    this.socialLogin('google');
  }

  loginWithFacebook(): void {
    this.socialLogin('facebook');
  }

  /**
   * Xử lý social login chung cho cả Google và Facebook.
   * Gọi backend lấy auth URL rồi redirect user.
   */
  private socialLogin(provider: SocialLoginProvider): void {
    if (this.isSocialLoading) return;
    this.isSocialLoading = true;

    this.authService.getAuthUrl(provider).pipe(
      finalize(() => {
        this.isSocialLoading = false;
      })
    ).subscribe({
      next: (url: string) => {
        window.location.href = url;
      },
      error: (error: HttpErrorResponse) => {
        const providerName = provider === 'google' ? 'Google' : 'Facebook';
        this.toastService.showToast({
          error: error,
          defaultMsg: `Lỗi kết nối với ${providerName}`,
          title: 'Lỗi Đăng Nhập'
        });
      }
    });
  }

  // ==================== Shared Helpers ====================

  /**
   * Xử lý sau khi login thành công (dùng chung cho cả login thường và social login).
   */
  private handlePostLogin(apiResponse: ApiResponse): void {
    this.userResponse = {
      ...apiResponse.data,
      date_of_birth: new Date(apiResponse.data.date_of_birth),
    };

    if (this.rememberMe) {
      this.userService.saveUserResponseToLocalStorage(this.userResponse);
    }

    const targetRoute = this.userResponse?.role.name === 'admin' ? '/admin' : '/';
    this.router.navigate([targetRoute]);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // ==================== Private ====================

  private loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: ({ data: roles }: ApiResponse) => {
        this.roles = roles;
        this.selectedRole = roles.length > 0 ? roles[0] : undefined;
      },
      error: (error: HttpErrorResponse) => {
        this.toastService.showToast({
          error: error,
          defaultMsg: 'Lỗi tải danh sách vai trò',
          title: 'Lỗi Tải Vai Trò'
        });
      }
    });
  }
}
