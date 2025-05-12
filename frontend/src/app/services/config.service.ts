import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';  // Import environment

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private apiBaseUrl: string = environment.apiBaseUrl;

  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }
}
