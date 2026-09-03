import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { NewCustomer } from './new-customer/new-customer';
import { NewJobcard } from './new-jobcard/new-jobcard';
import { Customers } from './customers/customers';
import { JobCards } from './job-cards/job-cards';
import { Invoices } from './invoices/invoices';
import { InvoiceDetail } from './invoice-detail/invoice-detail';
import { InvoicePrint } from './invoice-print/invoice-print';
import { JobCardDetail } from './job-card-detail/job-card-detail';
import { MoreOptions } from './more-options/more-options';
import { Inventory } from './inventory/inventory';
import { Reports } from './reports/reports';
import { Expenses } from './expenses/expenses';
import { CustomerDetail } from './customer-detail/customer-detail';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'new-customer', component: NewCustomer },
  { path: 'new-job-card', component: NewJobcard },
  { path: 'customers', component: Customers },
  { path: 'customers/:id', component: CustomerDetail },
  { path: 'job-cards', component: JobCards },
  { path: 'job-cards/:id', component: JobCardDetail },
  { path: 'invoices', component: Invoices },
  { path: 'invoices/:id', component: InvoiceDetail },
  { path: 'invoices/:id/print', component: InvoicePrint },
  { path: 'more-options', component: MoreOptions },
  { path: 'inventory', component: Inventory },
  { path: 'reports', component: Reports },
  { path: 'expenses', component: Expenses }
];
