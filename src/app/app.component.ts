import {Component} from '@angular/core';
import {saveAs} from 'file-saver';
import {MatDialog} from '@angular/material/dialog';
import {HelpComponent} from './help/help.component';
import {Util} from './util';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  static OUTPUT_FILENAME = 'KiwiSaver transactions.csv';
  static TOTAL_NEEDED = 1042.86;
  static MONTH_START = 6; // July
  static MONTH_END = 5; // June
  static DAY_END_OF_END_MONTH = 30; // 30 June

  static EFFECTIVE_DATE_COL = 'EffectiveDate';
  static DESCRIPTION_COL = 'Description';
  static OPTION_COL = 'Option';
  static ACCOUNT_COL = 'Account';
  static UNITS_COL = 'Units';
  static UNIT_PRICE_COL = 'UnitPrice';
  static AMOUNT_COL = 'Amount';

  file: File = null;
  records: any = null;
  columnsToDisplay = [
    AppComponent.EFFECTIVE_DATE_COL,
    AppComponent.DESCRIPTION_COL,
    AppComponent.OPTION_COL,
    AppComponent.ACCOUNT_COL,
    AppComponent.UNITS_COL,
    AppComponent.UNIT_PRICE_COL,
    AppComponent.AMOUNT_COL
  ];
  directDebitTotal = 0;
  memberContributionsTotal = 0;
  loadingDataFromCsv = false;
  currentYear: string;

  get total() {
    return this.directDebitTotal + this.memberContributionsTotal;
  }

  get leftToGet() {
    return AppComponent.TOTAL_NEEDED - this.total;
  }

  get totalIsEnough() {
    return this.total >= AppComponent.TOTAL_NEEDED;
  }

  constructor(public dialog: MatDialog) {
  }

  static getHeaderArray(csvRecordsArr: any) {
    const headers = (csvRecordsArr[0] as string).split(',');
    const headerArray = [];
    for (const header of headers) {
      headerArray.push(header);
    }
    return headerArray;
  }

  // From https://stackoverflow.com/a/1293163/8355496
  static csvToArray(strData) {
    const strDelimiter = ',';

    // Create a regular expression to parse the CSV values.
    const objPattern = new RegExp(
      (
        // Delimiters.
        '(\\' + strDelimiter + '|\\r?\\n|\\r|^)' +

        // Quoted fields.
        '(?:"([^"]*(?:""[^"]*)*)"|' +

        // Standard fields.
        '([^\\' + strDelimiter + '\\r\\n]*))'
      ),
      'gi'
    );

    // Create an array to hold our data. Give the array
    // a default empty first row.
    const arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    let arrMatches: any;

    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    // tslint:disable-next-line:no-conditional-assignment
    while (arrMatches = objPattern.exec(strData)) {

      // Get the delimiter that was found.
      const strMatchedDelimiter = arrMatches[1];

      // Check to see if the given delimiter has a length
      // (is not the start of string) and if it matches
      // field delimiter. If id does not, then we know
      // that this delimiter is a row delimiter.
      if (
        strMatchedDelimiter.length &&
        strMatchedDelimiter !== strDelimiter
      ) {

        // Since we have reached a new row of data,
        // add an empty row to our data array.
        arrData.push([]);

      }

      let strMatchedValue;

      // Now that we have our delimiter out of the way,
      // let's check to see which kind of value we
      // captured (quoted or unquoted).
      if (arrMatches[2]) {

        // We found a quoted value. When we capture
        // this value, unescape any double quotes.
        strMatchedValue = arrMatches[2].replace(
          new RegExp('""', 'g'),
          '"'
        );

      } else {

        // We found a non-quoted value.
        strMatchedValue = arrMatches[3];

      }


      // Now that we have our value string, let's add
      // it to the data array.
      arrData[arrData.length - 1].push(strMatchedValue);
    }

    // Return the parsed data.
    return arrData;
  }

  private static csvArrayToModels(csvArray: any[][]) {
    const headers = csvArray[0];

    const modelArray = [];
    for (const row of csvArray.slice(1)) {
      const model = {};
      for (const [i, item] of row.entries()) {
        const header = headers[i];
        model[header] = item;
      }
      modelArray.push(model);
    }
    return modelArray;
  }

  static lineCountsForGovtContributions(line: any) {
    for (const validLine of Util.VALID_LINES) {
      let lineMatchesValidLines = true;
      for (const key of Object.keys(validLine)) {
        if (line[key] !== validLine[key]) {
          lineMatchesValidLines = false;
        }
      }
      if (lineMatchesValidLines) {
        return true;
      }
    }
    return false;
  }

  private static removeNonGovtContributionLines(lines: any[]) {
    return lines.filter(AppComponent.lineCountsForGovtContributions);
  }

  private static getEndDate() {
    const today = new Date();

    if (today.getMonth() < AppComponent.MONTH_END) {
      return new Date(today.getFullYear(), AppComponent.MONTH_END, AppComponent.DAY_END_OF_END_MONTH);
    } else {
      return new Date(today.getFullYear() + 1, AppComponent.MONTH_END, AppComponent.DAY_END_OF_END_MONTH);
    }
  }

  private static getStartDate() {
    const today = new Date();

    if (today.getMonth() < AppComponent.MONTH_START) {
      return new Date(today.getFullYear() - 1, AppComponent.MONTH_START);
    } else {
      return new Date(today.getFullYear(), AppComponent.MONTH_START);
    }
  }

  private static removeContributionsBeforeStartDate(lines: any[]) {
    const startDate = this.getStartDate();

    const newLines = [];

    lines.forEach(line => {
      if (startDate.getTime() < Date.parse(line[this.EFFECTIVE_DATE_COL])) {
        newLines.push(line);
      }
    });

    return newLines;
  }

  private static getCurrentYear() {
    const options = {year: 'numeric', month: 'long', day: 'numeric'};
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();
    return startDate.toLocaleDateString('en-NZ', options) + ' - ' + endDate.toLocaleDateString('en-NZ', options);
  }

  updateTotals() {
    this.directDebitTotal = 0;
    this.memberContributionsTotal = 0;

    for (const line of this.records) {
      if (line.Account === Util.ACCOUNT_DIRECT_DEBITS) {
        this.directDebitTotal += Number(line.Amount);
      } else if (line.Account === Util.ACCOUNT_MEMBER_CONTRIBUTIONS) {
        this.memberContributionsTotal += Number(line.Amount);
      }
    }
  }

  uploadCsv($event: any): void {
    this.loadingDataFromCsv = true;
    const input = $event.target;
    const reader = new FileReader();
    reader.readAsText(input.files[0]);

    reader.onload = () => {
      const csvArray = AppComponent.csvToArray(reader.result);
      this.records = AppComponent.csvArrayToModels(csvArray);
      this.loadingDataFromCsv = false;
      this.records = AppComponent.removeNonGovtContributionLines(this.records).reverse();
      this.records = AppComponent.removeContributionsBeforeStartDate(this.records);
      this.currentYear = AppComponent.getCurrentYear();
      this.updateTotals();
    };

    reader.onerror = () => {
      this.loadingDataFromCsv = false;
      console.log('Error occurred while reading CSV.');
    };
  }

  downloadCsv() {
    const data = this.records;
    const replacer = (key, value) => value === null ? '' : value; // specify how you want to handle null values here
    const header = Object.keys(data[0]);
    const csv = data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
    csv.unshift(header.join(','));
    const csvArray = csv.join('\r\n');

    const blob = new Blob([csvArray], {type: 'text/csv'});
    saveAs(blob, AppComponent.OUTPUT_FILENAME);
  }

  openHelp() {
    this.dialog.open(HelpComponent, {
      autoFocus: false,
      maxHeight: '90vh'
    });
  }
}
