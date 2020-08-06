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

  constructor(public dialog: MatDialog) {
  }

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
  years: string[] = [];
  columnsToDisplay = [
    AppComponent.EFFECTIVE_DATE_COL,
    AppComponent.DESCRIPTION_COL,
    AppComponent.OPTION_COL,
    AppComponent.ACCOUNT_COL,
    AppComponent.UNITS_COL,
    AppComponent.UNIT_PRICE_COL,
    AppComponent.AMOUNT_COL
  ];
  directDebitTotals = {};
  memberContributionsTotals = {};
  loadingDataFromCsv = false;
  currentYear: string;

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

  private static sortIntoYears(lines: any[]) {
    const records = {};

    lines.forEach(line => {
        const startDate = this.getCurrentYear(new Date(Date.parse(line[this.EFFECTIVE_DATE_COL])));
        if (startDate in records) {
          records[startDate].push(line);
        } else {
          records[startDate] = [line];
        }
      }
    );

    return records;
  }

  private static getCurrentYear(day = new Date()) {
    const options = {year: 'numeric', month: 'long', day: 'numeric'};
    let startDate = null;
    let endDate = null;

    if (day.getMonth() < AppComponent.MONTH_START) {
      startDate = new Date(day.getFullYear() - 1, AppComponent.MONTH_START);
      endDate = new Date(day.getFullYear(), AppComponent.MONTH_END, AppComponent.DAY_END_OF_END_MONTH);
    } else {
      startDate = new Date(day.getFullYear(), AppComponent.MONTH_START);
      endDate = new Date(day.getFullYear() + 1, AppComponent.MONTH_END, AppComponent.DAY_END_OF_END_MONTH);
    }
    let currentYear = startDate.toLocaleDateString('en-NZ', options) + ' - ' + endDate.toLocaleDateString('en-NZ', options);
    if (endDate > new Date()) {
      currentYear += ' (current year)';
    }
    return currentYear;
  }

  private getTotal(year) {
    return this.directDebitTotals[year] + this.memberContributionsTotals[year];
  }

  private getLeftToGet(year) {
    return AppComponent.TOTAL_NEEDED - this.getTotal(year);
  }

  private getTotalIsEnough(year) {
    return this.getTotal(year) >= AppComponent.TOTAL_NEEDED;
  }

  updateTotals() {
    this.directDebitTotals = [];
    this.memberContributionsTotals = [];

    for (const year of this.years) {
      this.directDebitTotals[year] = 0;
      this.memberContributionsTotals[year] = 0;
      for (const line of this.records[year]) {
        if (line.Account === Util.ACCOUNT_DIRECT_DEBITS) {
          this.directDebitTotals[year] += Number(line.Amount);
        } else if (line.Account === Util.ACCOUNT_MEMBER_CONTRIBUTIONS) {
          this.memberContributionsTotals[year] += Number(line.Amount);
        }
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
      let records = AppComponent.csvArrayToModels(csvArray);
      records = AppComponent.removeNonGovtContributionLines(records).reverse();
      this.records = AppComponent.sortIntoYears(records);
      this.loadingDataFromCsv = false;
      this.years = Object.keys(this.records).reverse();
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
