"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IsoDate, IsoTimestamp, Side } from "@/lib/ops/types";

export type CustomerOrder = {
  id: string;
  symbol: string;
  name: string;
  side: Side;
  quantity: number;
  priceNgwee: number;
  tradeDate: IsoDate;
  clientName: string;
  placedAt: IsoTimestamp;
};

type CustomerOrdersState = {
  orders: CustomerOrder[];
};

type CustomerOrdersActions = {
  placeOrder: (order: Omit<CustomerOrder, "id" | "placedAt">) => CustomerOrder;
  clearOrders: () => void;
};

let orderSeq = 1;

export const useCustomerOrdersStore = create<
  CustomerOrdersState & CustomerOrdersActions
>()(
  persist(
    (set, get) => ({
      orders: [],
      placeOrder: (input) => {
        const order: CustomerOrder = {
          ...input,
          id: `CUST-${String(orderSeq++).padStart(4, "0")}`,
          placedAt: new Date().toISOString(),
        };
        set({ orders: [...get().orders, order] });
        return order;
      },
      clearOrders: () => set({ orders: [] }),
    }),
    { name: "ml-customer-orders" }
  )
);
