export interface PayHerePayment {
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: string;
  currency: string;
  hash: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_country?: string;
  custom_1?: string;
  custom_2?: string;
}

declare global {
  interface Window {
    payhere: {
      startPayment: (payment: PayHerePayment) => void;
      onCompleted: (orderId: string) => void;
      onDismissed: () => void;
      onError: (error: string) => void;
    };
  }
}

export const startPayherePayment = (
  paymentRequest: Omit<
    PayHerePayment,
    "merchant_id" | "sandbox" | "return_url" | "cancel_url" | "notify_url"
  >,
  onSuccess: (orderId: string) => void,
  onDismiss: () => void,
  onError: (error: string) => void,
) => {
  window.payhere.onCompleted = function onCompleted(orderId: string) {
    onSuccess(orderId);
  };

  window.payhere.onDismissed = function onDismissed() {
    onDismiss();
  };

  window.payhere.onError = function (errorMsg: string) {
    onError(errorMsg);
  };

  const payment: PayHerePayment = {
    ...paymentRequest,
    sandbox: true,
    merchant_id: import.meta.env.VITE_PAYHERE_MERCHANT_ID || "1228806",
    return_url: window.location.href,
    cancel_url: window.location.href,
    notify_url: import.meta.env.VITE_API_BASE_URL + "/payments/notify",
  };

  window.payhere.startPayment(payment);
};
