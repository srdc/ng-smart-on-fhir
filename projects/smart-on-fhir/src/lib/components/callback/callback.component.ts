import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {SmartAuthService} from "../../services/smart-auth.service";

@Component({
  selector: 'sof-callback',
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.css'
})
export class CallbackComponent implements OnInit {
  /**
   * Error message to display if authentication failed
   */
  error?: string;

  constructor(private router: Router, private route: ActivatedRoute, private auth: SmartAuthService) {
  }

  ngOnInit() {
    // Subscribe to route data to decide redirection URL after successful authentication
    this.route.data.subscribe(data => {
      // Call authentication service to handle code/token exchange
      this.auth.start().then(() => {
        // redirect to specified page after the token is successfully retrieved
        this.router.navigate([data['redirectTo']])
      }, (error) => {
        // set error message if failed
        this.error = error?.message || error?.toString() || 'Unknown error occurred.'
      })
    })
  }
}
