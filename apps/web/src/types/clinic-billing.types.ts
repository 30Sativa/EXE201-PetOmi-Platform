export interface InvoiceItemRequest {
  itemType: "Service" | "Medication" | "Product" | "Other" | string
  description: string
  quantity: number
  unitPrice: number
  serviceId?: string | null
  inventoryItemId?: string | null
  orderItemId?: string | null
  prescriptionId?: string | null
}

export interface CreateInvoiceRequest {
  appointmentId?: string | null
  orderId?: string | null
  examinationId?: string | null
  invoiceSource?: "Appointment" | "Order" | "Mixed" | string | null
  totalAmount: number
  discountAmount: number
  notes?: string | null
  items: InvoiceItemRequest[]
}

export interface AutoComposeInvoiceRequest {
  appointmentId?: string | null
  orderId?: string | null
  examinationId?: string | null
  discountAmount: number
  notes?: string | null
  includeService: boolean
  includePrescriptions: boolean
  includeOrderItems?: boolean
}

export interface InvoiceItemResponse {
  id: string
  itemType: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  serviceId: string | null
  inventoryItemId: string | null
  orderItemId: string | null
  prescriptionId: string | null
}

export interface InvoiceResponse {
  id: string
  appointmentId: string | null
  orderId: string | null
  examinationId: string | null
  clinicId: string
  invoiceSource: string
  invoiceCode: string
  totalAmount: number
  discountAmount: number
  finalAmount: number
  status: string
  paymentProvider: string
  paymentReference: string | null
  qrCodeUrl: string | null
  bankAccountNo: string | null
  bankCode: string | null
  paidAmount: number | null
  overpaidAmount: number
  paymentWebhookAt: string | null
  paymentMethod: string | null
  cancellationReason: string | null
  cancelledByUserId: string | null
  cancelledAt: string | null
  requiresManualRefund: boolean
  refundNote: string | null
  refundConfirmedByUserId: string | null
  refundConfirmedAt: string | null
  notes: string | null
  paidAt: string | null
  createdAt: string
  warnings: string[]
  items: InvoiceItemResponse[]
}

export interface PayInvoiceRequest {
  paymentMethod: "Cash" | "BankTransfer" | "SePayBankTransfer" | string
  paidAmount?: number | null
}

export interface RequestSePayPaymentRequest {
  paymentReference?: string | null
}

export interface SePayPaymentRequestResponse {
  invoiceId: string
  invoiceCode: string
  paymentReference: string
  finalAmount: number
  qrCodeUrl: string
  bankAccountNo: string
  bankCode: string
}

export interface SePayPaymentStatusResponse {
  invoiceId: string
  invoiceCode: string
  paymentReference: string | null
  status: "Pending" | "Paid" | "ReceivedUnmatched" | "AmountMismatch" | string
  message: string
  isFinal: boolean
  finalAmount: number
  paidAmount: number | null
  receivedAmount: number | null
  paymentTransactionId: string | null
  providerTransactionId: string | null
  transferContent: string | null
  transactionDate: string | null
}

export interface CancelInvoiceRequest {
  cancelReason?: string | null
}

export interface ConfirmManualRefundRequest {
  refundNote: string
}

export interface BillingAgingBucketResponse {
  count: number
  amount: number
}

export interface BillingDashboardSummaryResponse {
  unpaidInvoiceCount: number
  totalUnpaidAmount: number
  pendingReconciliationCount: number
  pendingManualRefundCount: number
  todayVisitCount: number
  todayPaidRevenue: number
  lowStockItemCount: number
  aging0To7Days: BillingAgingBucketResponse
  aging8To30Days: BillingAgingBucketResponse
  aging31PlusDays: BillingAgingBucketResponse
}

export interface BillingRevenueTrendPointResponse {
  date: string
  revenue: number
  paidInvoiceCount: number
  cashRevenue: number
  cashInvoiceCount: number
  bankTransferRevenue: number
  bankTransferInvoiceCount: number
  sePayRevenue: number
  sePayInvoiceCount: number
}

export interface BillingRevenueTrendResponse {
  fromDate: string
  toDate: string
  previousFromDate: string
  previousToDate: string
  totalRevenue: number
  totalPaidInvoiceCount: number
  previousTotalRevenue: number
  previousTotalPaidInvoiceCount: number
  revenueChangePercent: number | null
  paidInvoiceCountChangePercent: number | null
  totalCashRevenue: number
  totalCashInvoiceCount: number
  totalBankTransferRevenue: number
  totalBankTransferInvoiceCount: number
  totalSePayRevenue: number
  totalSePayInvoiceCount: number
  points: BillingRevenueTrendPointResponse[]
}

export interface InvoiceAgingItemResponse {
  invoiceId: string
  invoiceCode: string
  appointmentId: string | null
  orderId: string | null
  clinicId: string
  invoiceSource: string
  finalAmount: number
  pendingDays: number
  paymentProvider: string
  paymentReference: string | null
  createdAt: string
}

export interface PendingManualRefundItemResponse {
  invoiceId: string
  invoiceCode: string
  appointmentId: string | null
  orderId: string | null
  invoiceSource: string
  finalAmount: number
  paidAmount: number | null
  cancelledAt: string | null
  cancellationReason: string | null
  pendingDays: number
}

export interface SePayReconciliationItemResponse {
  paymentTransactionId: string
  providerTransactionId: string
  transferType: string
  transferAmount: number
  transactionDate: string | null
  referenceCode: string | null
  transferContent: string | null
  status: string
  invoiceId: string | null
  invoiceCode: string | null
  invoiceFinalAmount: number | null
  reviewNote: string | null
  reviewedByUserId: string | null
  reviewedAt: string | null
  pendingMinutes: number
  alertAfterMinutes: number
  needsAttention: boolean
}

export interface ManualMatchSePayTransactionRequest {
  invoiceId: string
  reviewNote?: string | null
}

export interface DismissSePayTransactionRequest {
  reviewNote: string
}

export interface CreateOrderItemRequest {
  inventoryItemId: string
  quantity: number
  unitPrice?: number | null
  description?: string | null
  sourceType?: "Retail" | "Prescription" | string
  prescriptionId?: string | null
}

export interface CreateOrderRequest {
  clinicId: string
  customerUserId?: string | null
  petId?: string | null
  appointmentId?: string | null
  orderType: "Retail" | "Prescription" | "Mixed" | string
  notes?: string | null
  confirmImmediately: boolean
  items: CreateOrderItemRequest[]
}

export interface OrderItemResponse {
  orderItemId: string
  inventoryItemId: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  sourceType: string
  prescriptionId: string | null
}

export interface OrderResponse {
  orderId: string
  clinicId: string
  customerUserId: string | null
  petId: string | null
  appointmentId: string | null
  orderType: string
  status: string
  totalAmount: number
  notes: string | null
  createdAt: string
  confirmedAt: string | null
  paidAt: string | null
  items: OrderItemResponse[]
}

