import { Request, Response } from "express";
import { google } from "googleapis";
import Quotation, {
  QuoteStatus,
  IQuotation,
  QuotePart,
} from "../models/quotation.model";

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

export const generatePDF = async (req: Request, res: Response) => {
  try {
    const quote = new Quotation({
      ...req.body,
    });

    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json",
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    const drive = google.drive({ version: "v3", auth });

    const templateId = process.env.TEMPLATE_ID!;
    const copyResponse = await drive.files.copy({
      fileId: templateId,
      requestBody: {
        name: `Quotation_${quote.id}_${quote.clientName}`,
      },
    });
    const newFileId = copyResponse.data.id!;

    const docs = google.docs({ version: "v1", auth });
    formatDocument(quote, docs, newFileId);

    const pdfResponse = await drive.files.export(
      {
        fileId: newFileId,
        mimeType: "application/pdf",
      },
      { responseType: "stream" }
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Quotation_${quote.id}_${quote.clientName}.pdf`
    );
    pdfResponse.data.pipe(res);

    // 5. (Optional) Delete the temporary file
    // pdfResponse.data.on('end', () => drive.files.delete({ fileId: newFileId }));
    return res.status(200);
  } catch (error) {
    console.error("Error generating PDF:", error);
    return res.status(500).json({ message: "Internal server error" });
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

async function formatDocument(
  quote: IQuotation,
  docs: any,
  documentId: string
): Promise<string> {
  const validUntilDate: Date = new Date(quote.validUntil.toString());
  const isExpired: boolean = validUntilDate < new Date();
  const validityText: string = isExpired
    ? `Expired On: ${quote.validUntil}`
    : `Valid Until: ${quote.validUntil}`;

  const requests = [];

  requests.push(
    {
      replaceAllText: {
        containsText: { text: "{{quote.id}}", matchCase: true },
        replaceText: quote.id,
      },
    },
    {
      replaceAllText: {
        containsText: { text: "{{currentDate}}", matchCase: true },
        replaceText: new Date().toLocaleDateString(),
      },
    },
    {
      replaceAllText: {
        containsText: { text: "{{quote.validUntil}}", matchCase: true },
        replaceText: validityText,
      },
    },
    {
      replaceAllText: {
        containsText: { text: "{{quote.clientName}}", matchCase: true },
        replaceText: quote.clientName,
      },
    }
  );

  const table = generateTableFromJson(quote.parts);

  requests.push({
    replaceAllText: {
      containsText: { text: "{{table}}", matchCase: true },
      replaceText: table,
    },
  });

  await docs.documents.batchUpdate({
    documentId: documentId,
    requestBody: { requests },
  });

  return documentId;
}

function generateTableFromJson(data: QuotePart[]): string {
  if (!data || data.length === 0) {
    return "No data available";
  }

  const allQuantities = new Set<number>();
  data.forEach((part) => {
    if (part.priceQuantities) {
      part.priceQuantities.forEach((pq) => {
        allQuantities.add(pq.quantity);
      });
    }
  });
  const sortedQuantities = Array.from(allQuantities).sort((a, b) => a - b);

  const h1List: number[] = [];
  data.forEach((part) => h1List.push(part.partName.length));
  h1List.push(11);
  const h1 = Math.max(...h1List) + 2;

  const h2List: number[] = [];
  data.forEach((part) => h2List.push(part.moq.toString().length));
  h2List.push(5);
  const h2 = Math.max(...h2List) + 2;

  console.log(h1List, h2List);

  const tableLines: string[] = [];

  let topBar = `+${"-".repeat(h1 * 2)}+${"-".repeat(h2 * 2)}+`;
  sortedQuantities.forEach(() => {
    topBar += "--------------------+";
  });
  tableLines.push(topBar);

  let headerRow = `| Part Name${" ".repeat(h1 * 2 - 11)}| MOQ${" ".repeat(
    h2 * 2 - 6
  )}|`;
  sortedQuantities.forEach((qty) => {
    headerRow += ` Price (${qty})${" ".repeat(
      20 - 10 - qty.toString().length
    )}|`;
  });
  tableLines.push(headerRow);

  let headerSeparator = `+${"-".repeat(h1 * 2)}+${"-".repeat(h2 * 2)}+`;
  sortedQuantities.forEach(() => {
    headerSeparator += "--------------------+";
  });
  tableLines.push(headerSeparator);

  data.forEach((part) => {
    let dataRow = `| ${part.partName}${" ".repeat(
      h1 * 2 - part.partName.length + 2
    )}| ${part.moq.toString()}${" ".repeat(
      h2 * 2 - part.moq.toString().length + 2
    )}|`;

    sortedQuantities.forEach((qty) => {
      const priceObj = part.priceQuantities?.find((pq) => pq.quantity === qty);
      let priceText = "-";
      if (priceObj && typeof priceObj.price === "number") {
        priceText = `$${priceObj.price
          .toFixed(2)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
      }
      dataRow += ` ${priceText}${" ".repeat(
        20 - priceObj!.price.toString().length - 4
      )}|`;
    });

    tableLines.push(dataRow);
  });

  let bottomBorder = `+${"-".repeat(h1 * 2)}+${"-".repeat(h2 * 2)}+`;
  sortedQuantities.forEach(() => {
    bottomBorder += "--------------------+";
  });
  tableLines.push(bottomBorder);

  return tableLines.join("\n");
}
