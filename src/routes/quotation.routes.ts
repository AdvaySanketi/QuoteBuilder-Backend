import { Router } from "express";
import {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  changeQuotationStatus,
  generatePDF,
  getConversionRateWithMetadata,
} from "../controllers/quotation.controller";
import { validateQuotation } from "../validators/quotation.validator";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", getAllQuotations);
router.post("/pdf", generatePDF);
router.get("/:id", getQuotationById);
router.post("/", validateQuotation, createQuotation);
router.put("/:id", updateQuotation);
router.delete("/:id", deleteQuotation);
router.patch("/:id/status", changeQuotationStatus);
router.get("/convrate", getConversionRateWithMetadata);

export default router;
