import {AsyncPipe} from "@angular/common";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {Component, inject} from '@angular/core';
import {catchError, EMPTY, exhaustMap, iif, interval, map, Observable, of, switchMap, tap} from "rxjs";

@Component({
  selector: 'app-root',
  imports: [AsyncPipe],
  template: `
      <div style="display: flex; justify-content: center; align-items: center; flex-direction: column; height: 100vh">
          <h1>Welcome to {{ title }}!</h1>
          <button (click)="start()">Click to slap</button>
          <h1>{{ response$ | async }}</h1>
      </div>
  `,
  styles: [],
})
export class AppComponent {
  readonly http = inject(HttpClient);
  readonly title = 'cat-slap';
  token: string | null = null;
  response$: Observable<never | Object> = EMPTY;

  start() {
    this.response$ = interval(11000).pipe(
        tap(number => console.log(number)),
        exhaustMap(_ => {
          return iif(() => this.token != null
              , this.slap()
              , this.http.post<LoginResponse>(loginUrl, loginBody, { headers }).pipe(
                  catchError((err: HttpErrorResponse, _) => this.handleError(err)),
                  tap(response => this.token = response?.data.token),
                  switchMap(() => this.slap())
              )
          );
        }),
        map((response: any) => response?.data.userData.slapCount)
    );
  }

  private slap() {
    return this.http.put(countUrl, {slapCount: this.getSlapCount()}, {headers: this.getHeaders()}).pipe(
        catchError((err: HttpErrorResponse, _) => this.handleError(err)),
    );
  }

  private handleError(err: HttpErrorResponse) {
    console.log(err)
    if (err.status === 401) {
      this.token = null;
    }
    return of();
  }

  private getSlapCount() {
    const max = 290;
    const min = 190;
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
  "Accept-Language": "en,fa;q=0.5",
  "Connection": "keep-alive",
  // "Content-Length": "16",
  "Content-Type": "application/json",
  "DNT": "1",
  "Host": "dppj1ypy65ita.cloudfront.net",
  "Origin": "https://catslaptoken.com",
  "Priority": "u=4",
  "Referer": "https://catslaptoken.com/",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "cross-site",
  "TE": "trailers",
  "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0",
}
