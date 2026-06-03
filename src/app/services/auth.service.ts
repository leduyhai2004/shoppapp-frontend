import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../responses/api.response';

/** Supported OAuth providers */
export type SocialLoginProvider = 'google' | 'facebook';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Lấy URL xác thực từ backend để redirect user đến OAuth provider.
   * @param provider - 'google' hoặc 'facebook'
   * @returns Observable chứa URL redirect
   */
  getAuthUrl(provider: SocialLoginProvider): Observable<string> {
    return this.http.get(
      `${this.apiBaseUrl}/users/auth/social-login?login_type=${provider}`,
      { responseType: 'text' }
    );
  }

  /**
   * Gửi authorization code đến backend để đổi lấy JWT token.
   * @param code - Authorization code từ OAuth provider
   * @param provider - 'google' hoặc 'facebook'
   * @returns Observable chứa ApiResponse với token
   */
  exchangeCodeForToken(code: string, provider: SocialLoginProvider): Observable<ApiResponse> {
    const params = new HttpParams()
      .set('code', code)
      .set('login_type', provider);

    return this.http.get<ApiResponse>(
      `${this.apiBaseUrl}/users/auth/social/callback`,
      { params }
    );
  }
}