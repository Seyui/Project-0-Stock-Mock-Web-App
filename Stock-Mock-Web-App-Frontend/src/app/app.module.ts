import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; 
import { HighchartsChartModule } from 'highcharts-angular';

// fake backend for login
import { fakeBackendProvider } from './_helpers';
import { AppRoutingModule } from './app-routing.module';
import { JwtInterceptor, ErrorInterceptor } from './_helpers';
import { AppComponent } from './app.component';
import { AlertComponent } from './_components';

// main contents for frontend
import { HomeComponent } from './home';
import { SearchComponent } from './search/search.component';

import stock from 'highcharts/modules/stock.src';
import more from 'highcharts/highcharts-more.src';
import { DetailComponent } from './detail/detail.component';;
import { WatchlistComponent } from './watchlist/watchlist.component'
;
import { PortfolioComponent } from './portfolio/portfolio.component'
export function highchartsModules() {
  // apply Highcharts Modules to this array
  return [stock, more];
}

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientModule,
        AppRoutingModule,
        MatAutocompleteModule,
        MatProgressSpinnerModule,
        MatTabsModule,
        MatFormFieldModule,
        MatInputModule,
        BrowserAnimationsModule,
        HighchartsChartModule
    ],
    declarations: [
        AppComponent,
        AlertComponent,
        HomeComponent,
        SearchComponent,
        DetailComponent ,
        WatchlistComponent ,
        PortfolioComponent      ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },

        // provider used to create fake backend
        fakeBackendProvider
    ],
    bootstrap: [AppComponent]
})
export class AppModule { };