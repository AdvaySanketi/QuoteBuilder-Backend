import mongoose, { Document, Schema } from "mongoose";

export enum QuoteStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export interface PriceQuantity {
  _id?: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface QuotePart {
  _id?: mongoose.Types.ObjectId;
  partName: string;
  moq: number;
  priceQuantities: PriceQuantity[];
}

export interface IQuotation extends Document {
  id: string;
  clientName: string;
  quoteNumber: string;
  currency: "INR" | "USD";
  validUntil: String;
  status: QuoteStatus;
  parts: QuotePart[];
  createdAt: String;
  updatedAt: Date;
}

export interface ConversionResponse {
  result: string;
  base_code: string;
  target_code: string;
  conversion_rate: number;
  conversion_result: number;
}

const PriceQuantitySchema = new Schema<PriceQuantity>(
  {
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const QuotePartSchema = new Schema<QuotePart>({
  partName: { type: String, required: true },
  moq: { type: Number, required: true },
  priceQuantities: [PriceQuantitySchema],
});

const QuotationSchema = new Schema<IQuotation>(
  {
    id: { type: String, required: true },
    clientName: { type: String, required: true },
    quoteNumber: { type: String, required: true, unique: true },
    currency: { type: String, enum: ["INR", "USD"], required: true },
    validUntil: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(QuoteStatus),
      default: QuoteStatus.DRAFT,
    },
    parts: [QuotePartSchema],
  },
  { timestamps: true, collection: "quotations" }
);

QuotationSchema.index({ status: 1 });
QuotationSchema.index({ id: 1 });

const Quotation = mongoose.model<IQuotation>("Quotation", QuotationSchema);

export default Quotation;
