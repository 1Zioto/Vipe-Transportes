import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: [`:host { display: flex; flex-direction: column; flex: 1; height: 100%; min-height: 0; }`]
})
export class AppComponent {}
