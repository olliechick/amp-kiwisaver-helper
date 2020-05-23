import {Component, OnInit} from '@angular/core';
import {AppComponent} from '../app.component';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {

  constructor() {
  }

  get validLines() {
    return AppComponent.VALID_LINES;
  }

  columnsToDisplay = ['Description', 'Account'];

  ngOnInit(): void {
  }

}
