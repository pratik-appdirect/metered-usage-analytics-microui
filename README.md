# Metered Usage Analytics Micro UI

A React-based web application for aggregating and displaying metered usage data.

## Features

- **Usage Data Aggregation**: Aggregate usage data by Request Group, Entitlement/Account, or SKU
- **Dynamic Form**: Input request group ID, entity ID (entitlement or account), and optional SKU filter
- **Flexible Aggregation**: Choose from multiple aggregation levels
- **Dynamic Tables**: Table columns adjust based on selected aggregation type
- **Timeline View**: Visual flow diagram showing usage data progression through different MongoDB collections:
  - Usage Request Raw
  - Usage Items
  - Usage Items Rated
  - Usage Items Failed
  - Usage Billing Items
- **Responsive Design**: Mobile-friendly interface
- **Modern UI**: Clean and intuitive user interface

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Usage Analytics API service running on `http://localhost:8080` (for live data)

## Installation

1. Clone or navigate to the repository:
```bash
cd metered-usage-analytics-microui
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode

Start the development server:
```bash
npm run dev
```

The application will open automatically in your browser at `http://localhost:3000`

### Production Build

Build the application for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
metered-usage-analytics-microui/
├── src/
│   ├── components/
│   │   ├── UsageAggregation.jsx    # Main component
│   │   └── UsageAggregation.css    # Component styles
│   ├── App.jsx                      # Root component
│   ├── App.css                      # App styles
│   ├── main.jsx                     # Application entry point
│   └── index.css                    # Global styles
├── index.html                       # HTML template
├── package.json                     # Dependencies and scripts
├── vite.config.js                   # Vite configuration
└── README.md                        # This file
```

## Usage

1. Enter a **Request Group ID** (required)
2. Enter an **Entitlement ID** or **Account ID** (required)
3. Select the entity type (Entitlement or Account) - this dynamically updates labels and options
4. Optionally enter a **SKU** to filter results by specific SKU
5. Choose an **Aggregation Type** from the dropdown:
   - Request Group & Entitlement/Account Id
   - SKU
6. Click **SUBMIT** to fetch and display the aggregated usage data
7. Click **View Timeline** on any row to see the data flow through different processing stages

## API Integration

### Aggregation Endpoint

The application is integrated with the Usage Analytics API running on `http://localhost:8080`.

**Endpoint**: `POST /api/v1/usage-analytics/aggregate`

**Request Body Mapping:**
- `searchCriteria.requestGroupId` ← Request Group Id input
- `searchCriteria.subscriptionId` ← Entitlement Id input (when Entitlement selected)
- `searchCriteria.accountId` ← Account Id input (when Account selected)
- `searchCriteria.unit` ← SKU input (optional)
- `aggregationCriteria.groupBy`:
  - `["REQUEST_GROUP_ID", "SUBSCRIPTION_ID"]` when "Request Group & Entitlement Id" selected
  - `["REQUEST_GROUP_ID", "ACCOUNT_ID"]` when "Request Group & Account Id" selected
  - `["UNIT"]` when "SKU" selected
- `aggregationCriteria.measures` ← `["TOTAL_PRICE", "QUANTITY"]` (fixed)
- `aggregationCriteria.aggregationType` ← `"SUM"` (fixed)

**Response Mapping:**
- `groupBy.requestGroupId` → Request Group Id column
- `groupBy.subscriptionId` → Entitlement Id column
- `groupBy.accountId` → Account Id column
- `groupBy.unit` → SKU column
- `sumValues.totalPrice` → Aggregated total column

### Switching Between Mock and Real Data

The application is currently configured to use the real API. To switch to mock data for testing:

1. Open `src/components/UsageAggregation.jsx`
2. In the `handleSubmit` function, comment out the real API call and uncomment the mock data section:

```javascript
// For real API (current):
const data = await fetchAggregatedUsage(requestGroupId, entityId, entityType, aggregationType, skuId);

// For mock data (testing):
// const data = getMockAggregatedData(requestGroupId, entityId, entityType, aggregationType, skuId);
// await new Promise(resolve => setTimeout(resolve, 500));
```

### CORS Configuration

The Vite dev server is configured with a proxy to avoid CORS issues:
- Proxy: `/api/v1/usage-analytics` → `http://localhost:8080`
- See `vite.config.js` for configuration details

### Timeline Endpoint

The timeline feature requires a POST request to `/api/usage/timeline`:

```javascript
const response = await fetch('/api/usage/timeline', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    requestGroupId,
    entityId,
    entityType,
    skuId // optional
  })
});
```

Expected response format for timeline:
```json
{
  "usageRequestRaw": { "quantity": 100, "totalPrice": 120 },
  "usageItems": { "quantity": 95, "totalPrice": 110 },
  "usageItemsRated": { "quantity": 90, "totalPrice": 100 },
  "usageItemsFailed": { "quantity": 5, "totalPrice": 10 },
  "usageBillingItems": { "quantity": 90, "totalPrice": 100 }
}
```

## Technologies Used

- **React 18.2**: UI library
- **Vite 5**: Build tool and development server
- **CSS3**: Styling with modern features
- **ES6+**: Modern JavaScript

## License

MIT

