# Robot Marketplace (#122)

A marketplace structure for trading robots, renting capabilities, and listing robot services.

## Directory Structure

```
robot-marketplace/
├── README.md                  # This file
├── package.json               # Node.js dependencies
├── src/
│   ├── models/
│   │   ├── listingModel.js    # Robot listing schema
│   │   ├── rentalModel.js     # Robot rental schema
│   │   └── reviewModel.js     # Marketplace reviews
│   ├── controllers/
│   │   ├── listingController.js  # CRUD for listings
│   │   ├── rentalController.js   # Rental lifecycle
│   │   └── reviewController.js   # Review system
│   └── routes/
│       └── marketplaceRoutes.js  # Express routes
└── docs/
    └── API.md                 # API documentation
```

## Features

- **Robot Listings**: Owners can list robots for sale or rent
- **Capability Rental**: Rent specific robot capabilities (e.g., gardening for 1 hour)
- **Reviews & Ratings**: Buyers/renters can review robots
- **Price Discovery**: Market-driven pricing in MYZ/XMR
- **Escrow Integration**: Uses MyZubster Gateway escrow for safe transactions

## Quick Start

```bash
cd robot-marketplace
npm install
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/marketplace/listings | Create a robot listing |
| GET | /api/marketplace/listings | Browse listings (filter by type, price, capabilities) |
| GET | /api/marketplace/listings/:id | Get listing details |
| PUT | /api/marketplace/listings/:id | Update listing |
| DELETE | /api/marketplace/listings/:id | Remove listing |
| POST | /api/marketplace/rentals | Rent a robot capability |
| GET | /api/marketplace/rentals/:id | Get rental status |
| POST | /api/marketplace/rentals/:id/complete | Complete rental |
| POST | /api/marketplace/reviews | Submit a review |
| GET | /api/marketplace/reviews/:robotId | Get robot reviews |

## License

MIT
