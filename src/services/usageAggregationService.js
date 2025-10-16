// usageAggregationService.js

/**
 * Fetches aggregated usage data based on the provided parameters
 */
export const fetchAggregatedUsage = async (requestGroupId, entityId, entityType, aggregationType, skuId) => {
  try {
    // Build search criteria
    const searchCriteria = {
      requestGroupId
    };

    // Add accountId or subscriptionId based on entityType
    if (entityType === 'entitlement') {
      searchCriteria.subscriptionId = entityId;
    } else {
      searchCriteria.accountId = entityId;
    }

    // Add unit/SKU if provided
    if (skuId && skuId.trim()) {
      searchCriteria.unit = skuId;
    }

    // Build aggregation criteria
    let groupBy;
    if (aggregationType === 'sku') {
      groupBy = ['UNIT'];
    } else {
      // requestGroup aggregation - include requestGroupId and either subscriptionId or accountId
      if (entityType === 'entitlement') {
        groupBy = ['REQUEST_GROUP_ID', 'SUBSCRIPTION_ID'];
      } else {
        groupBy = ['REQUEST_GROUP_ID', 'ACCOUNT_ID'];
      }
    }

    const requestBody = {
      searchCriteria,
      aggregationCriteria: {
        groupBy,
        measures: ['TOTAL_PRICE', 'QUANTITY'],
        aggregationType: 'SUM'
      }
    };

    const response = await fetch('/api/v1/usage-analytics/aggregate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch usage data');
    }

    const data = await response.json();
    
    // Transform API response to match UI format
    const transformedData = {
      usages: data.map(item => ({
        requestGroupId: item.groupBy?.requestGroupId || requestGroupId,
        entityId: item.groupBy?.subscriptionId || item.groupBy?.accountId || entityId,
        skuId: item.groupBy?.unit || skuId,
        usageAmount: item.sumValues?.totalPrice || 0,
        quantity: item.sumValues?.quantity || 0
      }))
    };

    return transformedData;
  } catch (error) {
    console.error('Error fetching aggregated usage:', error);
    throw error;
  }
};

/**
 * Mock data generator for testing
 */
export const getMockAggregatedData = (requestGroupId, entityId, entityType, aggregationType, skuId) => {
  const mockData = {
    usages: []
  };

  // Generate mock data based on aggregation type
  switch (aggregationType) {
    case 'sku':
      // SKU level aggregation (includes SKU column)
      mockData.usages = [
        {
          requestGroupId: requestGroupId || 'X',
          entityId: entityId || '2',
          skuId: '123',
          usageAmount: 1234.56
        },
        {
          requestGroupId: requestGroupId || 'X',
          entityId: entityId || '2',
          skuId: '124',
          usageAmount: 567.89
        },
        {
          requestGroupId: requestGroupId || 'X',
          entityId: entityId || '3',
          skuId: '125',
          usageAmount: 543.33
        }
      ];
      break;

    case 'requestGroup':
    default:
      // Request Group & Entitlement/Account level aggregation
      // Include SKU data if we need to filter by it
      if (skuId && skuId.trim()) {
        mockData.usages = [
          {
            requestGroupId: requestGroupId || 'X',
            entityId: entityId || '2',
            skuId: '123',
            usageAmount: 1234.56
          },
          {
            requestGroupId: requestGroupId || 'X',
            entityId: entityId || '2',
            skuId: '124',
            usageAmount: 567.89
          },
          {
            requestGroupId: requestGroupId || 'X',
            entityId: entityId || '3',
            skuId: '125',
            usageAmount: 543.33
          }
        ];
      } else {
        mockData.usages = [
          {
            requestGroupId: requestGroupId || 'X',
            entityId: entityId || '2',
            usageAmount: 2345.78
          }
        ];
      }
      break;
  }

  // Filter by SKU if provided
  if (skuId && skuId.trim()) {
    mockData.usages = mockData.usages.filter(usage => usage.skuId === skuId);
  }

  return mockData;
};

/**
 * Fetches timeline data for a specific usage row
 */
export const fetchTimelineData = async (requestGroupId, entityId, entityType, skuId) => {
  try {
    const response = await fetch('/api/usage/timeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestGroupId,
        entityId,
        entityType,
        skuId: skuId || undefined
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch timeline data');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching timeline data:', error);
    throw error;
  }
};
