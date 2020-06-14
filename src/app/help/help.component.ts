import {Component, OnInit} from '@angular/core';
import {Util} from '../util';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {

  constructor() {
  }

  get validLines() {
    return Util.VALID_LINES;
  }

  columnsToDisplay = ['Description', 'Account'];

  ngOnInit(): void {
  }

}
