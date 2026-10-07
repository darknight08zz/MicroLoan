export type LoanStatus =
  | "Requested"
  | "Funded"
  | "Withdrawn"
  | "Repaid"
  | "Defaulted"
  | "Cancelled";

export const LoanStatusMap: Record<number, LoanStatus> = {
  0: "Requested",
  1: "Funded",
  2: "Withdrawn",
  3: "Repaid",
  4: "Defaulted",
  5: "Cancelled",
};

export interface Loan {
  id: number;
  borrower: string;
  lender: string;
  principal: string; // Formatted ETH string e.g. "0.001 ETH"
  principalRaw: bigint;
  repayment: string; // Formatted ETH string e.g. "0.0011 ETH"
  repaymentRaw: bigint;
  dueDate: string; // Formatted date string
  dueDateTimestamp: number;
  status: LoanStatus;
  statusCode: number;
}
