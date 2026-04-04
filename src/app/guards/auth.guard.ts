import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { from, map } from 'rxjs';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  const router   = inject(Router);
  return from(supabase.client.auth.getSession()).pipe(
    map(({ data }) => {
      if (data.session) return true;
      router.navigate(['/login']);
      return false;
    })
  );
};
