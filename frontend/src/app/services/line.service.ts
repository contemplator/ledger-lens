import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LineService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  bindAccount(idToken: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/line/bind`, { id_token: idToken });
  }
}
