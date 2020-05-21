# AMP KiwiSaver helper

A tool to calculate how much you will need to pay to make the most of government contributions based on reports generated by AMP.

🚧 Currently under construction 🚧

## Premise
The New Zealand Government will pay 50 cents for every dollar that you contribute to your KiwiSaver, up to $521.43 per year. So to take full advantage of this, you want to contribute at least $1,042.86 each year. This is calculated over the period 1 July–31 June. See https://www.kiwisaver.govt.nz/new/benefits/mtc/ for more details.

If your KiwiSaver is with AMP, they can generate a report which includes your contributions for an arbitrary date range as a CSV, but they don't give you a total for the contributions that count towards the $1,042.86.

The only way to get that information is to email them and ask for it, but that gets tiresome (although it is a good way to double-check).

I created this Angular project that creates a CSV of just the contributions that count towards the $1,042.86.

## Instructions

1. Download the CSV from AMP (log in → Accounts → AMP KiwiSaver Scheme → Transactions) from 1 July to the current date
2. Nothing yet! (this is a WIP)

## Development

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.
