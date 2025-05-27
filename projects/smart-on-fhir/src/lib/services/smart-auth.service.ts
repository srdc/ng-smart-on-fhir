import {Inject, Injectable} from '@angular/core';
import {LoginClientConfig} from "../model/login-client.config";
import {LaunchClientConfig} from "../model/launch-client.config";
import {SmartOnFhirConfig} from "../model/smart-on-fhir.config";
import Client from "fhirclient/lib/Client";
import * as FHIR from "fhirclient";
import {firstValueFrom, Subject} from "rxjs";

/**
 * SMART Authentication Service
 * Handles authentication/authorization using the fhirclient library (or offline via SHC/SHL), and stores the state
 */
@Injectable()
export class SmartAuthService {

  // selected login method
  private method: 'offline'|'login'|'launch' = 'offline';
  // selected client
  private selectedClient: LoginClientConfig|LaunchClientConfig|undefined = undefined;
  // auth enabled (not public)
  private enabled = true;
  // authenticated user
  private user: fhir4.Practitioner|undefined;
  // selected/authenticated patient
  private patient: fhir4.Patient|undefined;

  private SAVED_SESSION_KEY: string = 'SMART_APPS_SESSION';
  private client$ = new Subject<Client|undefined>()
  private clientPromise = firstValueFrom(this.client$)
  private LAUNCHED_URL = 'SMART_APPS_LAUNCHED_URL';

  constructor(@Inject('sofConfig') public config: SmartOnFhirConfig = {}) {
  }

  isLoggedIn() {
    return !!this.patient || ((<LoginClientConfig>this.selectedClient)?.scope?.includes('launch/patient') ? false : !!this.user);
  }

  /**
   * Login
   * @param config - selected client's config
   * @param patient - selected patient, if applicable
   */
  login(config: LoginClientConfig, patient?: fhir4.Patient) {
    this.method = 'login'
    this.selectedClient = config
    this.enabled = !config.isPublic
    this.patient = patient;
    this.saveSession()
    if (!config.isPublic) {
      FHIR.oauth2.authorize({
        iss: config.iss,
        redirectUri: config.redirectUri,
        clientId: config.clientId,
        scope: config.scope,
        noRedirect: true
      }).then(redirectUrl => {
        const [url, params] = (<string>redirectUrl).split('?')
        let queryParams = params.split('&')
        if (config.aud) {
          queryParams = queryParams.filter(param => !param.startsWith('aud='))
          queryParams.push('aud=' + config.aud)
        }
        if (config.promptLogin) {
          queryParams.push('prompt=login')
        }
        window.location.href = [url, queryParams.join('&')].join('?')
      }, console.error)
    } else if(patient) {
      this.client$.next(FHIR.client(config.iss))
    }
  }

  // get public client without authentication
  publicClient(iss: string) {
    return FHIR.client(iss);
  }

  // launch with selected issuer
  launch(iss: string, launch: string, clientConfig?: LaunchClientConfig) {
    const clientId = this.config.clientId || (this.config.clientIds && this.config.clientIds[iss])
    this.method = 'launch'
    this.selectedClient = clientConfig
    this.enabled = true
    this.saveSession({
      [this.LAUNCHED_URL]: window.location.href
    })
    FHIR.oauth2.authorize({
      clientId, iss, launch,
      redirectUri: this.config.redirectUrl
    })
  }

  // start auth flow
  async start(): Promise<any> {
    const sessionContext = this.restoreSession()
    if (sessionContext?.method === 'offline') {
      this.offline(sessionContext.patient, sessionContext.shc || [])
    } else if ((<LoginClientConfig>sessionContext?.selectedClient)?.isPublic) {
      this.client$.next(this.publicClient((<LoginClientConfig>sessionContext?.selectedClient).iss))
    } else {
      await FHIR.oauth2.ready().then(async client => {
        this.checkPatientInToken(client)
        this.user = <fhir4.Practitioner|undefined>(await client.user.read().catch(() => undefined))
        this.patient = await client.patient.read().catch(() => undefined)
        this.client$.next(client);
      })
    }
    return sessionContext;
  }

  // offline mode with SHCs
  offline(patient: fhir4.Patient, shc: string[]) {
    this.patient = patient;
    this.user = undefined;
    this.method = 'offline';
    this.selectedClient = undefined;
    this.client$.next(undefined)
    this.saveSession({shc});
  }

  // store session in the session storage
  saveSession(params?: Object) {
    sessionStorage.setItem(this.SAVED_SESSION_KEY, JSON.stringify({
      patient: this.patient,
      user: this.user,
      method: this.method,
      selectedClient: this.selectedClient,
      enabled: this.enabled,
      ...(params || {})
    }))
  }

  // restore session from the local storage
  restoreSession() {
    const saved = sessionStorage.getItem(this.SAVED_SESSION_KEY);
    if (saved) {
      const { patient, user, method, selectedClient, enabled, ...rest } = JSON.parse(saved);
      this.patient = patient;
      this.user = user;
      this.method = method;
      this.selectedClient = selectedClient;
      this.enabled = enabled;
      return { patient, user, method, selectedClient, enabled, ...rest };
    }
    return null;
  }

  // if the patient is not received properly from the response, but exists in the token, add it to the response
  private checkPatientInToken(client: Client) {
    const sessionId = sessionStorage['SMART_KEY']  && JSON.parse(sessionStorage['SMART_KEY'])
    if (sessionId && sessionStorage[sessionId]) {
      const session = JSON.parse(sessionStorage[sessionId])
      const token = session.tokenResponse?.access_token
      const id_token = session.tokenResponse?.id_token
      const parsed = JSON.parse(atob(token.split('.')[1]))
      let changed = false;
      if (!client.user?.id && id_token) {
        const parts = id_token.split('.')
        const parsedIdToken = JSON.parse(atob(parts[1]))
        parsedIdToken.fhirUser = 'Practitioner/' + parsedIdToken.sub;
        session.tokenResponse.id_token = [parts[0], btoa(JSON.stringify(parsedIdToken)), parts[2]].join('.');
        changed = true;
      }
      if (!client.getPatientId() && parsed.patient) {
        session.tokenResponse.patient = parsed.patient
        changed = true;
      }
      if (changed) {
        sessionStorage[sessionId] = JSON.stringify(session)
        window.location.reload()
      }
    }
  }

  getClient() {
    return this.clientPromise;
  }

  logout() {
    this.clearSession();
    this.getClient().then(client => {
      const loginClient = this.config?.loginClients?.find(lc => lc.iss === client?.state.serverUrl);
      if ((<any>loginClient)?.logoutUri) {
        window.location.href = (<any>loginClient).logoutUri
      } else {
        window.location.href = window.location.href.split('#')[0].replace(/shc$/, 'login')
      }
    }, err => window.location.reload())
  }

  private clearSession() {
    sessionStorage.clear()
    this.method = 'offline';
    this.patient = this.user = undefined;
    this.selectedClient = undefined;
    this.enabled = true;
  }

  async getPatient() {
    if (this.patient) return this.patient;
    await this.getClient();
    return this.patient;
  }
}
