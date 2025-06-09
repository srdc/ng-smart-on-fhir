[![SRDC](https://www.srdc.com.tr/wp-content/uploads/2014/12/srdc-wp.png)](https://srdc.com.tr/en)

# NgSmartOnFhir - 🔥HL7 SMART-on-FHIR Library for Angular 

[![Angular v17](https://img.shields.io/badge/Angular-v17.3.0-red.svg)](https://v17.angular.io/docs)
[![NPM](https://img.shields.io/npm/v/ng-smart-on-fhir.svg)](https://www.npmjs.com/package/ng-smart-on-fhir)
![License](https://img.shields.io/github/license/srdc/ng-smart-on-fhir.svg)

An Angular library to provide SMART-on-FHIR authorization with:

- Login, Callback, Launch pages
- Routing wrapper
- Routing Guard
- SMART-on-FHIR authentication service
- Authenticated FHIR client service
- SMART Health Card QR reader and parser components

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.0.

## Build

Run `ng build ng-smart-on-fhir` to build the project. The build artifacts will be stored in the `dist/` directory.

## Installation

### 1. Library and FHIR typings 

```
npm install @types/fhir --save-dev
npm install ng-smart-on-fhir --save
```

### 2. Bootstrap (Optional)

The `ng-smart-on-fhir` library has visual components such as the Login page.
If you prefer to use the library's predefined bootstrap theme, you need to install
Bootstrap as well.

```
npm install bootstrap --save
```

## Usage

### 1. Importing the Module

Import the `SmartOnFhirModule` to your app module with the necessary [configurations](smartonfhirconfig). 

***app.module.ts***
```{ts}
import { SmartOnFhirModule } from '@srdc/smart-on-fhir';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SmartOnFhirModule.forRoot(environment.smartConfig) // import module with configurations
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

***environment.ts***
```{ts}
export const environment = {
  smartConfig: {
    clientIds: { // Client IDs to be used in Launch flow
      'https://lforms-smart-fhir.nlm.nih.gov/v/r4/fhir': 'srdc-qrisk'
    },
    redirectUrl: appBaseUrl + '/callback',
    loginClients: [ // buttons for initiating SMART Login flow
      {
        label: 'EPIC',
        image: 'asset/epic.png', // image to be displayed in login page
        // if image is not provided, a button with the label will be shown
        // you can set background, color, etc. to customize the button
        iss: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/',
        redirectUri: appBaseUrl + '/callback',
        clientId: '<epic-client-id>',
        scope: 'launch launch/patient patient/*.*'
      }
    ],
    launchClients: [ // links to the providers with SMART Launch flow
      {
        label: 'NIH - Smart Launch',
        background: '#326295',
        color: 'white',
        url: 'https://lforms-smart-fhir.nlm.nih.gov/'
      }
    ]
  }
}
```

Configuration model is described below:

#### SmartOnFhirConfig

| Field                         | Optional    | Type                                             | Description                                                                                                  |
|-------------------------------|-------------|--------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| logo                          | true        | string                                           | Logo image url to be used in Login page                                                                      |
| title                         | true        | string                                           | Title string to be used in Login page                                                                        |
| shcLoginEnabled<sup>[1]</sup> | true        | boolean                                          | Enable login with Smart Health Cards (SHC)                                                                   |
| shcCallbackUrl<sup>[1]</sup>  | true        | string                                           | Callback url to handle SHC Logins                                                                            |
| clientIds<sup>[2]</sup>       | conditional | object                                           | { Issuer -> clientId } mappings for launch clients                                                           |
| clientId<sup>[2]</sup>        | conditional | string                                           | Client ID if there is single client ID for any client or to use when the issuer is not matched during launch |
| redirectUrl<sup>[2]</sup>     | conditional | string                                           | Redirect Url for Launch clients                                                                              |
| launchClients<sup>[2]</sup>   | true        | Array<[LaunchClientConfig](#launchclientconfig)> | List of clients using SMART App Launch flow                                                                  |
| loginClients<sup>[3]</sup>    | true        | Array<[LoginClientConfig](#loginclientconfig)>   | List of clients using the SMART Login flow                                                                   |

*[1] The "SMART Health Cards" is a standard developed by HL7 and piloted during the COVID pandemic to allow citizens share their vaccination data as QR codes with trusted
authorities. [Learn More]()*

*[2] The SMART App Launch flow allows integration between FHIR based EHR systems and other applications by defining a standard to grant permissions to an application directly from the EHR's launcher application. [Learn More]()*

*[3] The SMART Login flow is an authentication mechanism based on OAuth2 with the addition of SMART scopes that indicates the access rights for a patient's data in the EHR. [Learn More]()*

#### LaunchClientConfig

| Field                       | Optional | Type   | Description                             |
|-----------------------------|----------|--------|-----------------------------------------|
| label                       | false    | string | Label of the launcher EHR               |
| url                         | false    | string | URL of the EHR that contains the launch |
| image                       | true     | string | Image of the EHR logo<sup>*</sup>       |
| icon                        | true     | string | Icon class for the button               |
| background                  | true     | string | Background color of the button          |
| color                       | true     | string | Text color of the button                |

**If the `image` is provided, it will be shown in the login page. Otherwise, it will appear as a button with `label` as text.*

#### LoginClientConfig

export interface LoginClientConfig {
promptLogin?: boolean;
logoutUri?: string;
isPublic?: boolean;
}

| Field       | Optional | Type    | Description                                                                                                                                                  |
|-------------|----------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| label       | false    | string  | Label of the launcher EHR                                                                                                                                    |
| image       | true     | string  | Image of the EHR logo<sup>*</sup>                                                                                                                            |
| icon        | true     | string  | Icon class for the button                                                                                                                                    |
| background  | true     | string  | Background color of the button                                                                                                                               |
| color       | true     | string  | Text color of the button                                                                                                                                     |
| clientId    | false    | string  | Client ID of the application in the login provider                                                                                                           |
| iss         | false    | string  | Issuer (login provider)                                                                                                                                      |
| redirectUri | false    | string  | Callback page after login to handle token                                                                                                                    |
| scope       | false    | string  | Requested scopes (add `launch/patient` scope for the patient facing apps)                                                                                    |
| aud         | true     | string  | Use if the `aud` claim should be different than the `iss`                                                                                                    |
| promptLogin | true     | boolean | If set to true, the prompt=login parameter is added to the authentication request so the user will be asked for credentials even if an active session exists |
| logoutUri   | true     | string  | Logout url of the authentication provider to securely terminate the user session                                                                             |
| isPublic    | true     | boolean | If set to true, the authentication will be disabled. Additionally, if `launch/patient` scope exists, a patient selection page will be shown.                 |

**If the `image` is provided, it will be shown in the login page. Otherwise, it will appear as a button with `label` as text.*

### 2. Adding SMART Routes (Login, Callback, Launch) to Your Application

Adding SMART authentication handling routes in your **Routing Module**:

```
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {withSmartHandlerRoutes} from "smart-on-fhir";
import {HomeComponent} from "./home/home.component";
import {ResultsComponent} from "./results/results.component";

const routes: Routes = withSmartHandlerRoutes( // wrap your own routes with the SMART routes
  [
    {
      path: '',
      component: HomeComponent
    }
  ], // your app routes
  '/', // base url to be redirected
  'both', // supported login methods; options are: 'launch'|'client'|'both'
  true // redirect to login page if not authorized
);

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

```

> The `withSmartHandlerRoutes` method adds an auth Guard to your routes automatically if `redirectToLoginIfUnauthorized` parameter is `true`.

### 3. Inject the SMART Fhir Client Service in Your Components

```
...
import {SmartOnFhirService} from "@srdc/smart-on-fhir"

@Component({
  selector: 'app-component',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  
  private client: Client|undefined;
  patient: fhir4.Patient|undefined;
  vitalSigns: fhir4.Bundle<fhir4.Observation>|undefined;
  
  constructor(private smartOnFhirService: SmartOnFhirService) {}
  
  async ngOnInit() {
    this.patient = await this.sof.getPatient();
    this.vitalSigns = await this.sof.search<fhir4.Observation>(
      "Observation",
      { category: 'vital-signs' }
    );
  }

...

```

### 4. Theming

The NgSmartOnFhir library provides two predefined themes:

- Default
- Bootstrap

#### Default Theme

You can import the default theme to your root `style.scss` file, or to the project styles in `angular.json`.

```{sass}
@import 'node_modules/ng-smart-on-fhir/themes/default.scss'
```

You can also override the classes to design a custom theme:

```
@import 'node_modules/ng-smart-on-fhir/themes/default.scss'

.sof-shadow { box-shadow: 0 0 2px 0 #ccc; }
.sof-light-background { background: #e0e0e0 !important; }
.sof-primary-background { background: #16A4D8 !important; }
.sof-text-light { color: #ffffff !important; }
.sof-text-gray { color: #999999 !important; }
.sof-text-dark { color: #000000 !important; }
.sof-text-danger { color: #ba1239 !important; }
.sof-text-center { text-align: center; }
.sof-text-bold { font-weight: bold; }
.sof-card { box-shadow: 0 0 3px 0 #eee; }
.sof-card-header {
  background: #1181aa;
  color: white;
}
.sof-login-card-header { /* ... */ }

.sof-button {
  background: #ffffff;
  color: #000000;
  &:hover {
    background: #e0e0e0;
  }
}

/* .sof-button-[primary, secondary, ...] { ... } */

.sof-alert-danger {
  background: #ff979b;
  color: #550509;
}

.sof-login-client-w-image { /* ... */ }

/* ... */

```

You can find the custom classes in the [default.scss](https://github.com/srdc/ng-smart-on-fhir/blob/main/src/lib/themes/default.scss) file.

#### Bootstrap Theme

You can import bootstrap css to your project in `angular.json`:

```
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
      ...
      "architect": {
        "build": {
          ...
            "styles": [
              "node_modules/bootstrap/dist/css/bootstrap.min.css",
              "src/styles.css"
            ],
            "scripts": []
          },
          ...
        "test": {
            ...
            "styles": [
              "node_modules/bootstrap/dist/css/bootstrap.min.css",
              "src/styles.css"
            ],
            "scripts": []
          }
        }
      }
    }
  }
}

```

Or you can import it to your `styles.scss` and customize theme variables:

```
/* You can add global styles to this file, and also import other style files */
@import "../../../node_modules/bootstrap/scss/functions";

$_primary: #761eb1;
$_secondary: #9328DA;

$theme-colors: (
  "light":      #f5f5f5,
  "dark":       adjust-hue(shade-color($_primary, 45), 10),
  "primary":    $_primary,
  "secondary": $_secondary,
  "info": #abedf6,
  "success":    #b8e186,
  "warning":    #fde47f,
  "danger": #f32509,
  "primary-text": #f8f9fa,
  "secondary-text": #f8f9fa
);

.btn {
  color: #f8f9fa !important;
}

.input-group > input:focus + .input-group-text {
  background: $_primary !important;
}

@import "../../../node_modules/bootstrap/scss/variables";
@import "../../../node_modules/bootstrap/scss/variables-dark";
@import "../../../node_modules/bootstrap/scss/maps";
@import "../../../node_modules/bootstrap/scss/mixins";
@import "../../../node_modules/bootstrap/scss/root";

@import "../../../node_modules/bootstrap/scss/buttons";
@import "../../../node_modules/bootstrap/scss/bootstrap";
```

After importing bootstrap, add the bootstrap theme to your root `styles.scss` file or `angular.json`:

```
/* ...import/customize bootsrap */

@import '../../../node_modules/ng-smart-on-fhir/themes/bootstrap.scss';
```

## Development

You can continue development of this library by including it as a `devDependency` in your `package.json`. Before doing it, you will need to link the library.
First, build the library:

```
cd path/to/smart-on-fhir 
ng build smart-on-fhir
```

Then, link the `smart-on-fhir` library globally:

```
cd path/to/smart-on-fhir/dist/smart-on-fhir 
npm link
```

Next, link the `smart-on-fhir` library to your project:

```
cd path/to/your-project 
npm link smart-on-fhir
```

Finally, add your `smart-on-fhir` library as a `devDependency` in your `package.json`:

```
  "devDependencies": {
    "smart-on-fhir": "file:.path/to/smart-on-fhir/dist/smart-on-fhir",
  }
```

Import the module in your project with something like this:

```
import {
    SmartOnFhirModule
} from "../../../../../../smart-on-fhir/projects/smart-on-fhir/src/lib/smart-on-fhir.module";
```

## Example Usage

You can check the [risk calculation apps](https://github.com/srdc/smart-on-fhir-web-apps) to see how the `ng-smart-on-fhir` library is used with multiple login options.  
