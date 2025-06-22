export interface UserOrderDetail {
  id: number;
  color: string;
  order_id: number;
  product_id: number;
  product_name: string;
  thumbnail: string;
  price: number;
  number_of_products: number;
  total_money: number;
}

export interface UserOrderResponse {
  id: number;
  user_id: number;
  fullname: string;
  phone_number: string;
  email: string;
  address: string;
  note: string;
  order_date: string; // ISO date string
  status: string;
  total_money: number;
  shipping_method: string | null;
  shipping_address: string | null;
  shipping_date: string | null;
  payment_method: string | null;
  order_details: UserOrderDetail[];
}
