import {Component} from '@angular/core';
import {saveAs} from 'file-saver';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  static OUTPUT_FILENAME = 'KiwiSaver transactions.csv';

  file: File = null;
  records: any = null;

  static getHeaderArray(csvRecordsArr: any) {
    const headers = (csvRecordsArr[0] as string).split(',');
    const headerArray = [];
    for (const header of headers) {
      headerArray.push(header);
    }
    return headerArray;
  }

  static downloadFile(data: any) {
    const replacer = (key, value) => value === null ? '' : value; // specify how you want to handle null values here
    const header = Object.keys(data[0]);
    const csv = data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
    csv.unshift(header.join(','));
    const csvArray = csv.join('\r\n');

    const blob = new Blob([csvArray], {type: 'text/csv'});
    saveAs(blob, AppComponent.OUTPUT_FILENAME);
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
    return true;
  }

  private static removeNonGovtContributionLines(lines: any) {
    const outputLines = [];

    for (const line of lines) {
      if (AppComponent.lineCountsForGovtContributions(line)) {
        outputLines.push(line);
      }
    }
    return outputLines;
  }

  processCsv($event: any): void {
    const input = $event.target;
    const reader = new FileReader();
    reader.readAsText(input.files[0]);

    reader.onload = () => {
      const csvArray = AppComponent.csvToArray(reader.result);
      this.records = AppComponent.csvArrayToModels(csvArray);
      this.records = AppComponent.removeNonGovtContributionLines(this.records);
      AppComponent.downloadFile(this.records);
    };

    reader.onerror = () => console.log('Error occurred while reading CSV.');
  }
}
