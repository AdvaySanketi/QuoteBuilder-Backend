# QuoteBuilder Backend  

## Overview  
The backend of QuoteBuilder is built with **Node.js, Express, and TypeScript**, providing a robust API for managing quotations, request authentication, and integrations with external services like Google Docs.  

🚀 **Github Repo**: [Frontend Repo](https://quote-builder-advay.vercel.app/)
🚀 **Live Link**: [QuoteBuilder](https://quote-builder-advay.vercel.app/)

---

## **Tech Stack**  
- **Runtime**: Node.js  
- **Framework**: Express.js  
- **Language**: TypeScript  
- **Database**: MongoDB
- **Authentication**: JWT 

---

## **Project Structure**  
```plaintext
src/
├── controllers/       # Route handlers 
├── models/            # Database models
├── routes/            # API endpoints
├── middleware/        # Auth, error handling
├── validators/        # Validation
└── index.ts           # Express app setup
```

---

# **Database Schema (MongoDB)**  

## **Collection: `quotations`**  
The `quotations` collection stores all quotation data, including client details, pricing tiers, and status history.  

### **Document Structure**  
```typescript
{
  _id: ObjectId,                // MongoDB auto-generated ID
  id: string,                   // Application-level unique ID (required)
  clientName: string,           // Client/company name (required)
  quoteNumber: string,          // Unique quotation number (required, unique)
  currency: "INR" | "USD",      // Currency type (required)
  validUntil: string,           // Quotation expiry date (required)
  status: QuoteStatus,          // Current status (DRAFT/SENT/APPROVED/REJECTED/EXPIRED)
  parts: QuotePart[],           // List of parts with pricing tiers
  createdAt: string,            // Auto-generated creation timestamp
  updatedAt: Date,              // Auto-generated last update timestamp
}
```

---

### **Sub-Types**  

#### **1. `QuotePart` (Embedded)**  
```typescript
{
  _id?: ObjectId,                    // Optional sub-document ID
  partName: string,                  // Name/description of the part (required)
  moq: number,                       // Minimum order quantity (required)
  priceQuantities: PriceQuantity[],  // Quantity-based pricing tiers
}
```

#### **2. `PriceQuantity` (Embedded)**  
```typescript
{
  quantity: number,             // Quantity threshold (required)
  price: number,                // Price per unit at this quantity (required)
}
```

#### **3. `QuoteStatus` (Enum)**  
| Value      | Description                  |
|------------|------------------------------|
| `DRAFT`    | Unsubmitted quotation        |
| `SENT`     | Sent to client               |
| `APPROVED` | Client-approved              |
| `REJECTED` | Client-rejected              |
| `EXPIRED`  | Passed validity date         |

---

## **API Endpoints**  

### **Quotation Routes**  

| Method | Endpoint                     | Description                              | Middleware/Validation          |
|--------|------------------------------|------------------------------------------|--------------------------------|
| `GET`  | `/quotations`                | Get all quotations (filterable)          | `authenticate`                              |
| `POST` | `/quotations`                | Create a new quotation                   | `authenticate`, `validateQuotation`            |
| `GET`  | `/quotations/:id`            | Get a specific quotation by ID           | `authenticate`                              |
| `PUT`  | `/quotations/:id`            | Update a quotation (full replacement)    | `authenticate`, `validateQuotation`                               |
| `DELETE` | `/quotations/:id`          | Delete a quotation                       | `authenticate`                              |
| `PATCH` | `/quotations/:id/status`   | Change quotation status (e.g., DRAFT → SENT) | `authenticate`                              |
| `POST` | `/quotations/pdf`            | Generate a PDF for a quotation           | `authenticate`                              |
| `GET`  | `/quotations/convrate`       | Get currency conversion rate (INR ↔ USD) with metadata | `authenticate`                              |

---

## Installation & Setup

1. Install dependencies:  
   ```bash
   npm install
   ```
2. Set up `.env`
   ```env
   PORT=3000
   MONGODB_URI=mongo_uri
   JWT_SECRET=your_jwt_secret
   TEMPLATE_ID=pdf_docs_template_id
   ```
3. Start the server:  
   ```bash
   npm run dev
   ```

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. **Fork** this repository
2. **Create a new branch**:
   ```sh
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**:
   ```sh
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**:
   ```sh
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request** 🚀

---

## 📝 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

## 🆘 Support

Having trouble? Want to request a feature? Here's how you can get help:

- Open an issue.
- Contact the maintainer: [Advay Sanketi](https://advay-sanketi-portfolio.vercel.app/)
