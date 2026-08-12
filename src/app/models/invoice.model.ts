export interface LineItem {
service_name: any;
quantity: any;
labour_charge: any;
part_name: any;
unit_price: any;
total_amount: any;
  id: string;
  name: string;
  type: 'Service' | 'Part';
  qty: number;
  rate: number;
  amount: number;
}

export interface InvoicePayment {
  amount: number;
  paidAt: string;
}

export interface Invoice {
invoice_number: any;
invoice_date: string|number|Date;
customer_name: any;
phone: any;
vehicle_number: any;
brand: any;
model: any;
odometer_reading: any;
tax: any;
subtotal: any;
balance_amount: any;
total_amount: any;
  invoice_id: any;
  id: string;
  invoiceNo: string;
  jobCardNo: string;
  customer: string;
  customerPhone: string;
  vehicleReg: string;
  vehicleModel: string;
  odometer: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
  jobCardStatus?: 'Open' | 'In Progress' | 'Ready' | 'Delivered';
  amount: number;
  paidAmount: number;
  payments?: InvoicePayment[];
  invoiceGenerated?: boolean;
  date: string;
  dueDate: string;
  createdAt: string;
  services: LineItem[];
  parts: LineItem[];
  notes?: string;
}

export const INVOICE_STATE_KEY = 'gbs-invoices';
export const CUSTOMER_STATE_KEY = 'gbs-customers';

export function balanceDue(invoice: Invoice): number {
  return Math.max(0, invoice.amount - (invoice.paidAmount || 0));
}

export function amountInWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (amount === 0) return 'Zero';
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return `${tens[Math.floor(n / 10)]}${ones[n % 10] ? ' ' + ones[n % 10] : ''}`.trim();
    if (n < 1000) return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ' ' + convert(n % 100) : ''}`.trim();
    if (n < 100000) return `${convert(Math.floor(n / 1000))} Thousand${n % 1000 ? ' ' + convert(n % 1000) : ''}`.trim();
    return `${convert(Math.floor(n / 100000))} Lakh${n % 100000 ? ' ' + convert(n % 100000) : ''}`.trim();
  };
  return `Rupees ${convert(Math.floor(amount))} Only`;
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function statusClass(status: Invoice['status']): string {
  return status === 'Paid' ? 'paid' : status === 'Partial' ? 'partial' : 'unpaid';
}
