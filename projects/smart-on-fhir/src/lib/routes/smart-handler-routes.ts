import {Routes} from "@angular/router";
import {CallbackComponent} from "../components/callback/callback.component";
import {LaunchComponent} from "../components/launch/launch.component";
import {LoginComponent} from "../components/login/login.component";
import {ShcShlHandlerComponent} from "../components/shc-shl-handler/shc-shl-handler.component";
import {redirectUnauthorizedToLogin} from "./guard/redirect-to-login-guard";

/**
 * Routes wrapper to add required components to execute Smart App Launch and Login flows
 * @param routes - Other application routes
 * @param redirectTo - Redirection after login
 * @param method - Allowed authentication flows: launch/client(login)/both
 * @param redirectToLoginIfUnauthorized - If true, adds auth guards to the application components
 * @param enableShc - If true, offline mode is allowed using Smart Health Cards
 */
export const withSmartHandlerRoutes: (routes: Routes, redirectTo: string, method: 'launch' | 'client' | 'both', redirectToLoginIfUnauthorized: boolean, enableShc?: boolean) => Routes =
  (routes: Routes, redirectTo: string, method: 'launch' | 'client' | 'both', redirectToLoginIfUnauthorized: boolean, enableShc?: boolean) => {
    const smartRoutes: Routes = [{
      path: 'callback',
      component: CallbackComponent,
      data: {redirectTo}
    }];
    if (method !== 'client') {
      smartRoutes.push({
        path: 'launch',
        component: LaunchComponent
      })
    }
    if (method !== 'launch') {
      smartRoutes.push({
        path: 'login',
        component: LoginComponent
      })
    }
    if (enableShc) {
      smartRoutes.push({
        path: 'shl',
        component: ShcShlHandlerComponent
      }, {
        path: 'shc',
        component: ShcShlHandlerComponent
      })
    }
    return [
      ...routes.map(route => {
        if (redirectToLoginIfUnauthorized) {
          route.canActivate = (route.canActivate || []).concat([redirectUnauthorizedToLogin]);
        }
        return route
      }),
      ...smartRoutes
    ]
  }
