declare module "midtrans-client" {
  export class Snap {
    constructor(options: {
      isProduction: boolean;
      serverKey: string;
      clientKey?: string;
    });
    createTransaction(
      parameter: unknown,
    ): Promise<{ token: string; redirect_url: string }>;
  }

  export interface MidtransQrisChargeResponse {
    status_code: string;
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_status: string;
    transaction_time?: string;
    expiry_time?: string;
    qr_url?: string;
  }

  export class CoreApi {
    constructor(options: {
      isProduction: boolean;
      serverKey: string;
      clientKey?: string;
    });
    charge(parameter: unknown): Promise<MidtransQrisChargeResponse>;
  }
}
