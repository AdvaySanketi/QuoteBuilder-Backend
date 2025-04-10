import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { QuoteStatus } from "../models/quotation.model";

const priceQuantitySchema = Joi.object({
  quantity: Joi.number().positive().required().messages({
    "number.base": "Quantity must be a number",
    "number.positive": "Quantity must be a positive number",
    "any.required": "Quantity is required",
  }),
  price: Joi.number().positive().required().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be a positive number",
    "any.required": "Price is required",
  }),
});

const partSchema = Joi.object({
  partName: Joi.string().trim().required().messages({
    "string.base": "Part name must be a string",
    "string.empty": "Part name cannot be empty",
    "any.required": "Part name is required",
  }),
  moq: Joi.number().integer().positive().required().messages({
    "number.base": "MOQ must be a number",
    "number.integer": "MOQ must be an integer",
    "number.positive": "MOQ must be a positive number",
    "any.required": "MOQ is required",
  }),
  priceQuantities: Joi.array().items(priceQuantitySchema).default([]).messages({
    "array.base": "Price quantities must be an array",
  }),
});

const quotationSchema = Joi.object({
  id: Joi.string().trim().required().messages({
    "string.base": "Quote ID must be a string",
    "string.empty": "Quote ID cannot be empty",
    "any.required": "Quote ID is required",
  }),
  clientName: Joi.string().trim().required().messages({
    "string.base": "Client name must be a string",
    "string.empty": "Client name cannot be empty",
    "any.required": "Client name is required",
  }),
  quoteNumber: Joi.string().trim().required().messages({
    "string.base": "Quote Number must be a string",
    "string.empty": "Quote Number cannot be empty",
    "any.required": "Quote Number is required",
  }),
  currency: Joi.string().valid("INR", "USD").required().messages({
    "string.base": "Currency must be a string",
    "string.empty": "Currency cannot be empty",
    "any.only": "Currency must be either INR or USD",
    "any.required": "Currency is required",
  }),
  validUntil: Joi.string().required().messages({
    "date.base": "Valid until must be a string",
    "any.required": "Valid until is required",
  }),
  status: Joi.string()
    .valid(...Object.values(QuoteStatus))
    .default(QuoteStatus.DRAFT)
    .messages({
      "string.base": "Status must be a string",
      "string.empty": "Status cannot be empty",
      "any.only": `Status must be one of ${Object.values(QuoteStatus).join(
        ", "
      )}`,
    }),
  parts: Joi.array().items(partSchema).default([]).messages({
    "array.base": "Parts must be an array",
  }),
});

export const validateQuotation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error, value } = quotationSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors: errorMessages });
  }

  req.body = value;
  next();
  return;
};

export const validateStatusChange = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = Joi.object({
    status: Joi.string()
      .valid(...Object.values(QuoteStatus))
      .required()
      .messages({
        "string.base": "Status must be a string",
        "string.empty": "Status cannot be empty",
        "any.only": `Status must be one of ${Object.values(QuoteStatus).join(
          ", "
        )}`,
        "any.required": "Status is required",
      }),
  });

  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors: errorMessages });
  }

  req.body = value;
  next();
  return;
};
