import { inject, Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from '../services/token.service';

export function tokenInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) {
  // Inject service trực tiếp bằng hàm inject()
  const authToken = inject(TokenService).getToken();  
  // Clone request và thêm header
  if (authToken?.trim()) {
    const newReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authToken}`)
    });
    return next(newReq);
  }

  // Trường hợp không có token
  return next(req);
}
