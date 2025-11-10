const axios = require('axios');

// QuickBooks API base URLs
const QB_API_URLS = {
  sandbox: 'https://sandbox-quickbooks.api.intuit.com',
  production: 'https://quickbooks.api.intuit.com'
};

/**
 * Create a customer in QuickBooks if they don't exist
 */
async function createCustomer(customerData, accessToken, realmId, environment) {
  const baseUrl = QB_API_URLS[environment] || QB_API_URLS.sandbox;

  try {
    // First, search if customer already exists by email
    const searchQuery = `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${customerData.email}'`;
    const searchResponse = await axios.get(
      `${baseUrl}/v3/company/${realmId}/query?query=${encodeURIComponent(searchQuery)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    // If customer exists, return their ID
    if (searchResponse.data.QueryResponse.Customer && searchResponse.data.QueryResponse.Customer.length > 0) {
      return searchResponse.data.QueryResponse.Customer[0].Id;
    }

    // Create new customer
    const customerPayload = {
      DisplayName: `${customerData.firstName} ${customerData.lastName}`,
      GivenName: customerData.firstName,
      FamilyName: customerData.lastName,
      PrimaryEmailAddr: {
        Address: customerData.email
      },
      PrimaryPhone: {
        FreeFormNumber: customerData.phone
      }
    };

    const createResponse = await axios.post(
      `${baseUrl}/v3/company/${realmId}/customer`,
      customerPayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    return createResponse.data.Customer.Id;
  } catch (error) {
    console.error('Error creating/finding customer:', error.response?.data || error.message);
    throw new Error('Failed to create customer in QuickBooks');
  }
}

/**
 * Create an invoice in QuickBooks
 */
async function createInvoice(bookingData, pricingData, accessToken, realmId, environment) {
  const baseUrl = QB_API_URLS[environment] || QB_API_URLS.sandbox;

  try {
    // First, create or find the customer
    const customerId = await createCustomer(
      {
        firstName: bookingData.firstName,
        lastName: bookingData.lastName,
        email: bookingData.email,
        phone: bookingData.phone
      },
      accessToken,
      realmId,
      environment
    );

    // Create invoice line item
    const invoicePayload = {
      CustomerRef: {
        value: customerId
      },
      Line: [
        {
          DetailType: 'SalesItemLineDetail',
          Amount: pricingData.suggestedPrice,
          Description: `${bookingData.trailer}\n${bookingData.startDate} to ${bookingData.endDate}\nPickup: ${formatTime(bookingData.pickupHour)}, Dropoff: ${formatTime(bookingData.dropoffHour)}\n\n${pricingData.tier} - ${pricingData.duration}`,
          SalesItemLineDetail: {
            Qty: 1,
            UnitPrice: pricingData.suggestedPrice
          }
        }
      ],
      CustomerMemo: {
        value: `Trailer Rental: ${bookingData.trailer}\nWhat you're hauling: ${bookingData.reason}`
      }
    };

    const response = await axios.post(
      `${baseUrl}/v3/company/${realmId}/invoice`,
      invoicePayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    const invoice = response.data.Invoice;

    return {
      invoiceId: invoice.Id,
      invoiceNumber: invoice.DocNumber,
      invoiceUrl: `https://app${environment === 'sandbox' ? '.sandbox' : ''}.qbo.intuit.com/app/invoice?txnId=${invoice.Id}`,
      totalAmount: invoice.TotalAmt
    };
  } catch (error) {
    console.error('Error creating invoice:', error.response?.data || error.message);
    throw new Error('Failed to create invoice in QuickBooks');
  }
}

/**
 * Helper function to format time
 */
function formatTime(hour) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${suffix}`;
}

module.exports = {
  createInvoice,
  createCustomer
};
