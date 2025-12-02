import { RNFile } from "./auth.request.dto";

export interface PaymentRequestDTO {
  orderIdFK: number;
  itemsFee: number;
  image: RNFile;
}
