import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ShlService} from "../../services/shl.service";
import * as jose from 'jose';
import {SmartOnFhirService} from "../../services/smart-on-fhir.service";
import {SmartAuthService} from "../../services/smart-auth.service";

/**
 * Component for searching and validating Smart Health Cards or Smart Health Links
 */
@Component({
  selector: 'sof-shc-shl-handler',
  template: `
    <div class="container">
      @if (invalidSignature) {
        <div class="sof-alert sof-alert-danger">
          Issuer verification failed for the Smart Health Card!
        </div>
        <button class="sof-button sof-button-danger" (click)="logout()"><i class="sof-icon sof-icon-caret-left"></i> Back</button>
        <button class="sof-button sof-button-warning sof-ml-1 sof-mt-1" (click)="invalidSignature = false"><i class="sof-icon sof-icon-exclamation"></i> Ignore and Continue</button>
      } @else {
        <table class="sof-table" id="shc-content">
          <tbody>
          <tr>
            <td><b>Patient</b></td>
            <td>{{ patientName }}</td>
          </tr>
          <tr>
            <td><b>Age</b></td>
            <td>{{ patientAge }}</td>
          </tr>
          <tr>
            <td><b>Gender</b></td>
            <td>{{ patient?.gender }}</td>
          </tr>
          @if (ips) {
            <tr>
              <td colspan="2"><h4>International Patient Summary Imported</h4></td>
            </tr>
            @for (section of ips.section; track section.title) {
              <tr>
                <td colspan="2">
                  <h5>{{section.title}}</h5>
                </td>
              </tr>
              <ng-template #myTemplate let-resource>
                @if (resource) {
                  @switch (resource.resourceType) {
                    @case ('Condition') {
                      <tr>
                        <td>{{resource.code?.coding?.at(0)?.display || resource.code?.coding?.at(0)?.code || resource.code?.text}}</td>
                        <td class="text-end">
                          {{resource.onsetDateTime | date}}
                        </td>
                      </tr>
                    }
                    @case ('MedicationStatement') {
                      <tr>
                        <td>{{resource.medicationCodeableConcept?.coding?.at(0)?.display || resource.medicationCodeableConcept?.coding?.at(0)?.code || resource.medicationCodeableConcept?.text}}</td>
                        <td class="text-end">
                          {{resource.effectiveDateTime | date}}
                        </td>
                      </tr>
                    }
                    @case ('AllergyIntolerance') {
                      <tr>
                        <td>{{resource.code?.coding?.at(0)?.display || resource.code?.coding?.at(0)?.code || resource.code?.text}}</td>
                        <td class="text-end">
                          {{resource.onsetDateTime | date}}
                        </td>
                      </tr>
                    }
                    @case ('Immunization') {
                      <tr>
                        <td>{{resource.vaccineCode?.coding?.at(0)?.display || resource.vaccineCode?.coding?.at(0)?.code || resource.vaccineCode?.text}}</td>
                        <td class="text-end">
                          {{resource.occurrenceDateTime | date}}
                        </td>
                      </tr>
                    }
                    @case ('Observation') {
                      <tr>
                        <td>{{resource.code?.coding?.at(0)?.display || resource.code?.coding?.at(0)?.code || resource.code?.text}}</td>
                        <td class="text-end">
                          {{resource.effectiveDateTime | date}}
                          <br>
                          @if (resource.valueQuantity) {
                            {{resource.valueQuantity.value}} {{resource.valueQuantity.unit || resource.valueQuantity.code}}
                          }
                        </td>
                      </tr>
                    }
                  }
                }
              </ng-template>
              @for (entry of section.entry; track entry.reference) {
                <ng-container *ngTemplateOutlet="myTemplate; context: { $implicit: referenceMap[entry.reference || ''] }"></ng-container>
              }
            }
          } @else {
            @for (resources of sof.importedResources | keyvalue; track resources.key) {
              <tr>
                <td><b>{{resources.key | camelCaseSpaced}}</b></td>
                <td><span class="sof-badge sof-primary-background sof-text-light">{{resources.value?.length}}</span></td>
              </tr>
            }
          }
          <tr>
            <td colspan="2" class="text-end">
              <button class="sof-button sof-button-primary" routerLink="/">Continue <i class="sof-icon sof-icon-caret-right"></i></button>
            </td>
          </tr>
          </tbody>
        </table>
      }
    </div>
    <style>
      #shc-content td:first-child {
        width: 25em;
        max-width: 100%;
      }
    </style>
  `
})

export class ShcShlHandlerComponent implements OnInit {

  invalidSignature: boolean = false;

  patient: fhir4.Patient|undefined;
  referenceMap: { [ref: string]: fhir4.Resource } = {};
  ips: fhir4.Composition|undefined;

  get patientName() {
    return this.patient?.name?.map(name => (name.given?.join(' ') || '') + ' ' + name.family).join(', ')
  }

  get patientAge() {
    if (this.patient?.birthDate) {
      return Math.ceil((Date.now() - new Date(this.patient.birthDate).getTime()) / (1000 * 3600 * 24 * 365))
    } else {
      return '';
    }
  }

  constructor(private route: ActivatedRoute, private auth: SmartAuthService, private shl: ShlService, public sof: SmartOnFhirService) {
    this.auth.getPatient().then(patient => this.patient = patient);
    route.fragment.subscribe(async fragment => {
      try {
        if (fragment?.startsWith('shlink:/')) {
          this.sof.importSHCData(await this.shl.handleShl(fragment))
          this.checkIPS();
        } else if (fragment?.startsWith('shc:/')) {
          this.sof.importSHCData(await this.shl.handleShc(fragment))
          this.checkIPS();
        } else {
          console.log("No SHC data in the fragment:", fragment)
        }
      } catch (error) {
        if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
          this.invalidSignature = true;
        }
      }
    })
  }

  ngOnInit() {
  }

  logout() {
    this.sof.logout();
  }

  private checkIPS() {
    if (this.sof.importedResources['Composition']) {
      const ips = (<fhir4.Composition[]>this.sof.importedResources['Composition'])
        .find((resource: fhir4.Composition) => resource.type?.coding?.some(code => code.code === '60591-5'))
      if (ips) {
        this.referenceMap = this.sof.getAllImportedResources().reduce((map: {[ref: string]: fhir4.Resource}, resource) => {
          map[resource.resourceType + '/' + resource.id] = resource;
          return map;
        }, {})
        this.ips = ips;
      }
    }
  }
}
