export type PosProvider = "toast" | "square" | "lightspeed" | "clover" | "custom";

export type PosConfig = {
  provider: PosProvider;
  apiKey?: string;
  apiSecret?: string;
  locationId?: string;
  syncMenu: boolean;
  syncOrders: boolean;
  syncPayments: boolean;
};

export type PosSyncResult = {
  success: boolean;
  synced: number;
  skipped: number;
  errors: string[];
};

export type PosMenuItem = {
  externalId: string;
  name: string;
  description?: string;
  price: number; // millimes
  category: string;
  imageUrl?: string;
  available: boolean;
};

export type PosOrder = {
  externalId: string;
  reference: string;
  items: Array<{
    externalId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  total: number;
  status: string;
  createdAt: string;
};

export type PosPayment = {
  externalId: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
};
