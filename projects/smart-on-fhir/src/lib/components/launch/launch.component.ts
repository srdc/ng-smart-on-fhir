import {Component, Inject} from '@angular/core';
import {ActivatedRoute} from "@angular/router";

import {SmartOnFhirConfig} from "../../model/smart-on-fhir.config";
import {SmartAuthService} from "../../services/smart-auth.service";

@Component({
  selector: 'sof-launch',
  templateUrl: './launch.component.html',
  styleUrl: './launch.component.css'
})
export class LaunchComponent {
  constructor(@Inject('sofConfig') private config: SmartOnFhirConfig,private route: ActivatedRoute, private auth: SmartAuthService) {
    // Handle the query parameters to be used in the Smart App Launch flow
    this.route.queryParams.subscribe(params => {
      const iss = decodeURIComponent(params['iss'])
      const launch = params['launch']
      // start launch flow
      this.auth.launch(iss, launch)
    })
  }
}
