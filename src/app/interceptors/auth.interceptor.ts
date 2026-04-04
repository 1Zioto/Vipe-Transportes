import { HttpInterceptorFn } from '@angular/common/http';

// Auth is now handled by Supabase client internally
export const authInterceptor: HttpInterceptorFn = (req, next) => next(req);
