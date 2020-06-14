export class Util {

  public static ACCOUNT_DIRECT_DEBITS = 'Direct Debits and Additional Contributions';
  public static ACCOUNT_MEMBER_CONTRIBUTIONS = 'Member Contribution';
  public static DESCRIPTION_REGULAR_CONTRIBUTION = 'Regular Contribution';
  public static DESCRIPTION_TRANSFER_OUT = 'Transfer Out';
  public static VALID_LINES = [
    {Description: Util.DESCRIPTION_REGULAR_CONTRIBUTION, Account: Util.ACCOUNT_DIRECT_DEBITS},
    {Description: Util.DESCRIPTION_TRANSFER_OUT, Account: Util.ACCOUNT_DIRECT_DEBITS},
    {Description: Util.DESCRIPTION_REGULAR_CONTRIBUTION, Account: Util.ACCOUNT_MEMBER_CONTRIBUTIONS}
  ];
}
