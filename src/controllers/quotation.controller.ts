import { Request, Response } from "express";
import Quotation, { QuoteStatus } from "../models/quotation.model";

export const getAllQuotations = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.clientName) {
      filter.clientName = { $regex: req.query.clientName, $options: "i" };
    }

    const quotations = await Quotation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Quotation.countDocuments(filter);

    res.status(200).json({
      data: quotations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getQuotationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let quotation;
    if (id.startsWith("Q-")) {
      quotation = await Quotation.findOne({ id });
    } else {
      quotation = await Quotation.findById(id);
    }

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    return res.status(200).json(quotation);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createQuotation = async (req: Request, res: Response) => {
  try {
    const quotation = new Quotation({
      ...req.body,
      status: QuoteStatus.DRAFT,
    });

    const savedQuotation = await quotation.save();
    res.status(201).json(savedQuotation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateQuotation = async (req: Request, res: Response) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (
      quotation.status !== QuoteStatus.DRAFT &&
      quotation.status !== QuoteStatus.REJECTED
    ) {
      return res.status(400).json({
        message:
          "Quotations in SENT, APPROVED, or EXPIRED status cannot be updated",
      });
    }

    const { quoteNumber, ...updateData } = req.body;

    const updatedQuotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    return res.status(200).json(updatedQuotation);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteQuotation = async (req: Request, res: Response) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (quotation.status !== QuoteStatus.DRAFT) {
      return res.status(400).json({
        message: "Only DRAFT quotations can be deleted",
      });
    }

    await Quotation.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Quotation deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const changeQuotationStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!Object.values(QuoteStatus).includes(status as QuoteStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const currentStatus = quotation.status;

    const isValidTransition = validateStatusTransition(
      currentStatus,
      status as QuoteStatus
    );

    if (!isValidTransition) {
      return res.status(400).json({
        message: `Cannot change status from ${currentStatus} to ${status}`,
      });
    }

    const updatedQuotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    return res.status(200).json(updatedQuotation);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

function validateStatusTransition(
  currentStatus: QuoteStatus,
  newStatus: QuoteStatus
): boolean {
  switch (currentStatus) {
    case QuoteStatus.DRAFT:
      return [QuoteStatus.SENT, QuoteStatus.EXPIRED].includes(newStatus);
    case QuoteStatus.SENT:
      return [
        QuoteStatus.APPROVED,
        QuoteStatus.REJECTED,
        QuoteStatus.EXPIRED,
      ].includes(newStatus);
    case QuoteStatus.APPROVED:
      return [QuoteStatus.EXPIRED].includes(newStatus);
    case QuoteStatus.REJECTED:
      return [QuoteStatus.DRAFT, QuoteStatus.EXPIRED].includes(newStatus);
    case QuoteStatus.EXPIRED:
      return [QuoteStatus.DRAFT].includes(newStatus);
    default:
      return false;
  }
}
