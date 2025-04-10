import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import quotationRoutes from "./routes/quotation.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const uptime = require("./middleware/uptime.middleware");

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MongoDB URI is not defined in environment variables.");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Welcome to the Quote Builder API",
    date: new Date(),
    supportEmail: "advay2807@gmail.com",
    "API Version": "1.0.0",
  });
});

app.use("/api/quotations", quotationRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: 200,
    message: "Server is healthy",
    uptime: uptime(process.uptime()),
    date: new Date(),
    supportEmail: "advay2807@gmail.com",
    "API Version": "1.0.0",
  });
});

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      message: err.message || "Internal Server Error",
    });
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
