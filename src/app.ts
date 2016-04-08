import { Component, provide } from 'angular2/core';
import { HTTP_PROVIDERS } from 'angular2/http';
import { bootstrap } from 'angular2/platform/browser';
import { ROUTER_PROVIDERS, ROUTER_DIRECTIVES, APP_BASE_HREF, RouterOutlet, RouteConfig } from 'angular2/router';
import { ScreenComponent } from './components/screen';

@Component({
    selector: 'app',
    directives: [RouterOutlet, ROUTER_DIRECTIVES],
    template: `<router-outlet></router-outlet>`
})
@RouteConfig([
    { path: '/screen/:name', name: 'Screen', component: ScreenComponent }
])
export class AppComponent {}

bootstrap(AppComponent, [
    ROUTER_PROVIDERS,
    HTTP_PROVIDERS,
    provide(APP_BASE_HREF, {useValue: '/'})
]);
