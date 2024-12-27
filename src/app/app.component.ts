import {AsyncPipe} from "@angular/common";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {Component, inject} from '@angular/core';
import {catchError, EMPTY, exhaustMap, iif, interval, map, Observable, of, switchMap, tap, throttleTime} from "rxjs";

@Component({
  selector: 'app-root',
  imports: [AsyncPipe],
  template: `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-direction: column; padding-block: 25vh">
          <div style="display: flex; flex-direction: column; align-items: center">
              <h2>Welcome to {{ title }}!</h2>
              <div style="display: flex; gap: 24px">
                  <h4>Min: {{ countRange.min }}</h4>
                  <h4>Max: {{ countRange.max }}</h4>
              </div>
              <button style="width: 164px; height: 32px; font-size: larger" (click)="start()">Click to slap</button>
          </div>
          @if (response$ | async; as response) {
              <div style="display: flex; flex-direction: column; align-items: center">
                  <hr style="width: 300px">
                  <h2 style="text-align: center">Total slap count: {{ response }}</h2>
                  <h3 style="color: green">+{{ lastCount }}</h3>
              </div>
          }
      </div>
  `,
  styles: [],
})
export class AppComponent {
  readonly TOKEN_KEY = "TOKEN"
  readonly http = inject(HttpClient);
  readonly title = 'cat-slap';
  readonly countRange = {
    min: 250,
    max: 290,
  };
  token: string | null = sessionStorage.getItem(this.TOKEN_KEY);
  lastCount?: number;
  response$: Observable<never | Object> = EMPTY;

  start() {
    this.response$ = interval().pipe(
        throttleTime(11000),
        exhaustMap(_ => iif(() => this.token != null, this.slap(), this.login().pipe(switchMap(() => this.slap())))),
        map((response: any) => response?.data.userData.slapCount)
    );
  }

  private login() {
    return this.http.post<LoginResponse>(loginUrl, loginBody, {headers}).pipe(
        catchError((err: HttpErrorResponse, _) => this.handleError(err)),
        tap(response => {
          this.token = response?.data.token;
          sessionStorage.setItem(this.TOKEN_KEY, this.token);
        })
    )
  }

  private slap() {
    const slapCount = this.getSlapCount();
    return this.http.put(countUrl, {slapCount}, {headers: this.getHeaders()}).pipe(
        tap(_ => this.lastCount = slapCount),
        catchError((err: HttpErrorResponse, _) => this.handleError(err)),
    );
  }

  private handleError(err: HttpErrorResponse) {
    if (err.status === 401) {
      this.token = null;
      sessionStorage.removeItem(this.TOKEN_KEY);
    }
    return of();
  }

  private getSlapCount() {
    const max = this.countRange.max;
    const min = this.countRange.min;
    return Math.round((Math.random() * (max - min) + min));
  }

  private getHeaders() {
    return {...headers, Authorization: `Bearer ${this.token}`};
  }
}

type LoginResponse = { data: { token: string } }
const loginUrl = "https://dppj1ypy65ita.cloudfront.net/v1/user/login"
const loginBody = {walletAddress: "0xb4924a01ec9b5c98d4dce61b2b9e0b5d395b3b73"}
const countUrl = "https://dppj1ypy65ita.cloudfront.net/v1/user/user-count"
const headers = {
  "Accept": "application/json, text/plain, */*",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  // "Accept-Language": "en,fa;q=0.5",
  "Connection": "keep-alive",
  // "Content-Length": "16",
  "Content-Type": "application/json",
  // "DNT": "1",
  "Host": "dppj1ypy65ita.cloudfront.net",
  // "Origin": "https://catslaptoken.com",
  "Priority": "u=4",
  // "Referer": "https://catslaptoken.com/",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "cross-site",
  "TE": "trailers",
  // "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0",
}
