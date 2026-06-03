import { api } from "@/lib/axios"
import { unwrapResponse } from "@/services/api-response"
import type {
  AutoComposeInvoiceRequest,
  BillingDashboardSummaryResponse,
  BillingRevenueTrendResponse,
  CancelInvoiceRequest,
  ConfirmManualRefundRequest,
  CreateOrderRequest,
  CreateInvoiceRequest,
  DismissSePayTransactionRequest,
  InvoiceAgingItemResponse,
  InvoiceResponse,
  ManualMatchSePayTransactionRequest,
  OrderResponse,
  PayInvoiceRequest,
  PendingManualRefundItemResponse,
  RequestSePayPaymentRequest,
  SePayPaymentRequestResponse,
  SePayPaymentStatusResponse,
  SePayReconciliationItemResponse,
} from "@/types"

const isNotFound = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "response" in error &&
  (error as { response?: { status?: number } }).response?.status === 404

export const getBillingSummaryApi = async (
  clinicId: string,
): Promise<BillingDashboardSummaryResponse> => {
  const response = await api.get("/invoices/billing-summary", { params: { clinicId } })
  return unwrapResponse<BillingDashboardSummaryResponse>(response)
}

export const getBillingRevenueTrendApi = async (params: {
  clinicId: string
  fromDate?: string
  toDate?: string
}): Promise<BillingRevenueTrendResponse> => {
  const response = await api.get("/invoices/billing-revenue-trend", { params })
  return unwrapResponse<BillingRevenueTrendResponse>(response)
}

export const getInvoiceByAppointmentApi = async (
  clinicId: string,
  appointmentId: string,
): Promise<InvoiceResponse | null> => {
  try {
    const response = await api.get(`/invoices/by-appointment/${appointmentId}`, { params: { clinicId } })
    return unwrapResponse<InvoiceResponse>(response)
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

export const getInvoiceByOrderApi = async (
  clinicId: string,
  orderId: string,
): Promise<InvoiceResponse | null> => {
  try {
    const response = await api.get(`/invoices/by-order/${orderId}`, { params: { clinicId } })
    return unwrapResponse<InvoiceResponse>(response)
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

export const createOrderApi = async (
  data: CreateOrderRequest,
): Promise<OrderResponse> => {
  const response = await api.post("/orders", data)
  return unwrapResponse<OrderResponse>(response)
}

export const getOrderApi = async (
  clinicId: string,
  orderId: string,
): Promise<OrderResponse | null> => {
  try {
    const response = await api.get(`/orders/${orderId}`, { params: { clinicId } })
    return unwrapResponse<OrderResponse>(response)
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

export const confirmOrderApi = async (
  clinicId: string,
  orderId: string,
): Promise<OrderResponse> => {
  const response = await api.post(`/orders/${orderId}/confirm`, {}, { params: { clinicId } })
  return unwrapResponse<OrderResponse>(response)
}

export const cancelOrderApi = async (
  clinicId: string,
  orderId: string,
): Promise<boolean> => {
  const response = await api.post(`/orders/${orderId}/cancel`, {}, { params: { clinicId } })
  return unwrapResponse<boolean>(response)
}

export const createInvoiceApi = async (
  clinicId: string,
  data: CreateInvoiceRequest,
): Promise<InvoiceResponse> => {
  const response = await api.post("/invoices", data, { params: { clinicId } })
  return unwrapResponse<InvoiceResponse>(response)
}

export const autoComposeInvoiceApi = async (
  clinicId: string,
  data: AutoComposeInvoiceRequest,
): Promise<InvoiceResponse> => {
  const response = await api.post("/invoices/auto-compose", data, { params: { clinicId } })
  return unwrapResponse<InvoiceResponse>(response)
}

export const payInvoiceApi = async (
  clinicId: string,
  invoiceId: string,
  data: PayInvoiceRequest,
): Promise<boolean> => {
  const response = await api.post(`/invoices/${invoiceId}/pay`, data, { params: { clinicId } })
  return unwrapResponse<boolean>(response)
}

export const requestSePayPaymentApi = async (
  clinicId: string,
  invoiceId: string,
  data: RequestSePayPaymentRequest = {},
): Promise<SePayPaymentRequestResponse> => {
  const response = await api.post(`/invoices/${invoiceId}/sepay/payment-request`, data, { params: { clinicId } })
  return unwrapResponse<SePayPaymentRequestResponse>(response)
}

export const getSePayPaymentStatusApi = async (
  clinicId: string,
  invoiceId: string,
): Promise<SePayPaymentStatusResponse> => {
  const response = await api.get(`/invoices/${invoiceId}/sepay/payment-status`, { params: { clinicId } })
  return unwrapResponse<SePayPaymentStatusResponse>(response)
}

export const cancelInvoiceApi = async (
  clinicId: string,
  invoiceId: string,
  data: CancelInvoiceRequest,
): Promise<boolean> => {
  const response = await api.post(`/invoices/${invoiceId}/cancel`, data, { params: { clinicId } })
  return unwrapResponse<boolean>(response)
}

export const getUnpaidAgingApi = async (params: {
  clinicId: string
  page?: number
  pageSize?: number
  minAgeDays?: number
}): Promise<InvoiceAgingItemResponse[]> => {
  const response = await api.get("/invoices/unpaid-aging", { params })
  return unwrapResponse<InvoiceAgingItemResponse[]>(response)
}

export const getPendingManualRefundsApi = async (params: {
  clinicId: string
  page?: number
  pageSize?: number
}): Promise<PendingManualRefundItemResponse[]> => {
  const response = await api.get("/invoices/manual-refunds/pending", { params })
  return unwrapResponse<PendingManualRefundItemResponse[]>(response)
}

export const confirmManualRefundApi = async (
  clinicId: string,
  invoiceId: string,
  data: ConfirmManualRefundRequest,
): Promise<boolean> => {
  const response = await api.post(`/invoices/${invoiceId}/refund-confirmation`, data, { params: { clinicId } })
  return unwrapResponse<boolean>(response)
}

export const getReconciliationApi = async (params: {
  clinicId: string
  limit?: number
  includeMatched?: boolean
  alertAfterMinutes?: number
}): Promise<SePayReconciliationItemResponse[]> => {
  const response = await api.get("/invoices/sepay/reconciliation", { params })
  return unwrapResponse<SePayReconciliationItemResponse[]>(response)
}

export const manualMatchSePayApi = async (
  clinicId: string,
  paymentTransactionId: string,
  data: ManualMatchSePayTransactionRequest,
): Promise<boolean> => {
  const response = await api.post(
    `/invoices/sepay/reconciliation/${paymentTransactionId}/manual-match`,
    data,
    { params: { clinicId } },
  )
  return unwrapResponse<boolean>(response)
}

export const dismissSePayApi = async (
  clinicId: string,
  paymentTransactionId: string,
  data: DismissSePayTransactionRequest,
): Promise<boolean> => {
  const response = await api.post(
    `/invoices/sepay/reconciliation/${paymentTransactionId}/dismiss`,
    data,
    { params: { clinicId } },
  )
  return unwrapResponse<boolean>(response)
}

