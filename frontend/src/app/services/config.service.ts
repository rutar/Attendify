import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfigService {
    // Default to prod; can be overridden for local development
    private apiBaseUrl: string = 'http://localhost:8080/api';
    //'http://localhost:3000/api'
    //'/api'

    getApiBaseUrl(): string {
        return this.apiBaseUrl;
    }
}
