import React, { useState } from 'react';
import './UsageAggregation.css';
import { fetchAggregatedUsage, getMockAggregatedData } from '../services/usageAggregationService';

const UsageAggregation = () => {
  const [requestGroupId, setRequestGroupId] = useState('');
  const [entityId, setEntityId] = useState('');
  const [entityType, setEntityType] = useState('entitlement'); // 'entitlement' or 'account'
  const [skuId, setSkuId] = useState('');
  const [aggregationType, setAggregationType] = useState('requestGroup');
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [timelineData, setTimelineData] = useState(null);

  const aggregationOptions = [
    { 
      value: 'requestGroup', 
      label: entityType === 'entitlement' 
        ? 'Request Group & Entitlement Id' 
        : 'Request Group & Account Id'
    },
    { value: 'sku', label: 'SKU' }
  ];

  const validateForm = () => {
    if (!requestGroupId.trim()) {
      setError('Request Group Id is required');
      return false;
    }
    if (!entityId.trim()) {
      setError(`${entityType === 'entitlement' ? 'Entitlement' : 'Account'} Id is required`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call real API
      const data = await fetchAggregatedUsage(requestGroupId, entityId, entityType, aggregationType, skuId);
      setUsageData(data.usages || []);
      
      // For testing with mock data, use this instead:
      // const data = getMockAggregatedData(requestGroupId, entityId, entityType, aggregationType, skuId);
      // await new Promise(resolve => setTimeout(resolve, 500));
      // setUsageData(data.usages || []);
    } catch (err) {
      setError(err.message);
      setUsageData([]);
    } finally {
      setLoading(false);
    }
  };

  const getTableColumns = () => {
    const columns = [
      { key: 'requestGroupId', label: 'Request Group Id', visible: true }
    ];

    // Always show Entitlement/Account column
    columns.push({
      key: 'entityId',
      label: entityType === 'entitlement' ? 'Entitlement Id' : 'Account Id',
      visible: true
    });

    // Show SKU column if aggregation is SKU or if SKU filter is provided
    if (aggregationType === 'sku' || skuId.trim()) {
      columns.push({
        key: 'skuId',
        label: 'SKU',
        visible: true
      });
    }

    // Always show aggregated total
    columns.push({
      key: 'aggregatedTotal',
      label: 'Aggregated total for usage billing items',
      visible: true
    });

    // Always show actions column
    columns.push({
      key: 'actions',
      label: 'Actions',
      visible: true
    });

    return columns;
  };

  const getGroupedData = () => {
    if (!usageData.length) return [];

    const grouped = new Map();

    usageData.forEach(item => {
      let groupKey;

      // Create group key based on aggregation type
      switch (aggregationType) {
        case 'sku':
          groupKey = `${item.requestGroupId}_${item.entityId}_${item.skuId}`;
          break;
        case 'requestGroup':
        default:
          groupKey = `${item.requestGroupId}_${item.entityId}`;
          break;
      }

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          requestGroupId: item.requestGroupId,
          entityId: item.entityId,
          skuId: item.skuId,
          items: [],
          aggregatedTotal: 0
        });
      }

      const group = grouped.get(groupKey);
      group.items.push(item);
      group.aggregatedTotal += parseFloat(item.usageAmount || 0);
    });

    return Array.from(grouped.values());
  };

  const columns = getTableColumns();
  const groupedData = getGroupedData();

  const hasFailedItems = (timelineData) => {
    if (!timelineData || !timelineData.usageItemsFailed) return false;
    return timelineData.usageItemsFailed.quantity > 0 || timelineData.usageItemsFailed.totalPrice > 0;
  };

  const handleInputChange = () => {
    // Clear results when any input changes
    setUsageData([]);
    setSelectedTimeline(null);
    setTimelineData(null);
  };

  const handleViewTimeline = async (row) => {
    console.log('View Timeline clicked for:', row);
    
    // If clicking the same row, toggle timeline off
    if (selectedTimeline === row) {
      setSelectedTimeline(null);
      setTimelineData(null);
      return;
    }
    
    setSelectedTimeline(row);
    
    // Fetch timeline data - using mock data for now
    // TODO: Replace with actual API call
    const timeline = {
      usageItems: {
        quantity: row.aggregatedTotal * 1.1,
        totalPrice: row.aggregatedTotal * 1.1
      },
      usageItemsRated: {
        quantity: row.aggregatedTotal,
        totalPrice: row.aggregatedTotal
      },
      usageItemsFailed: {
        quantity: row.aggregatedTotal * 0.1,
        totalPrice: row.aggregatedTotal * 0.1
      },
      usageBillingItems: {
        quantity: row.aggregatedTotal,
        totalPrice: row.aggregatedTotal
      }
    };
    
    setTimelineData(timeline);
  };

  return (
    <div className="usage-aggregation-container">
      <form onSubmit={handleSubmit} className="aggregation-form">
        <div className="form-row">
          <div className="form-field">
            <label className="field-label">
              Request Group Id
              <span className="required-indicator">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter Request Group Id"
              value={requestGroupId}
              onChange={(e) => {
                setRequestGroupId(e.target.value);
                handleInputChange();
              }}
              required
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              {entityType === 'entitlement' ? 'Entitlement id' : 'Account id'}
              <span className="required-indicator">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={entityType === 'entitlement' ? 'Enter Entitlement Id' : 'Enter Account Id'}
              value={entityId}
              onChange={(e) => {
                setEntityId(e.target.value);
                handleInputChange();
              }}
              required
            />
            <div className="entity-type-selector">
              <label className="radio-label">
                <input
                  type="radio"
                  name="entityType"
                  value="entitlement"
                  checked={entityType === 'entitlement'}
                  onChange={(e) => {
                    setEntityType(e.target.value);
                    handleInputChange();
                  }}
                />
                Entitlement
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="entityType"
                  value="account"
                  checked={entityType === 'account'}
                  onChange={(e) => {
                    setEntityType(e.target.value);
                    handleInputChange();
                  }}
                />
                Account
              </label>
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">
              SKU (Optional)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter SKU"
              value={skuId}
              onChange={(e) => {
                setSkuId(e.target.value);
                handleInputChange();
              }}
            />
          </div>
        </div>

        <div className="form-field aggregation-field">
          <label className="field-label">Aggregation Dropdown</label>
          <select
            className="form-select"
            value={aggregationType}
            onChange={(e) => {
              setAggregationType(e.target.value);
              handleInputChange();
            }}
          >
            {aggregationOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'SUBMIT'}
        </button>
      </form>

      {groupedData.length > 0 && (
        <div className="results-section">
          <div className="table-container">
            <table className="results-table">
              <thead>
                <tr>
                  {columns.map(col => (
                    col.visible && (
                      <th key={col.key}>{col.label}</th>
                    )
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedData.map((row, index) => (
                  <tr key={index}>
                    <td>{row.requestGroupId}</td>
                    <td>{row.entityId}</td>
                    {(aggregationType === 'sku' || skuId.trim()) && (
                      <td>{row.skuId || '-'}</td>
                    )}
                    <td className="total-cell">
                      {row.aggregatedTotal.toFixed(2)}
                    </td>
                    <td>
                      <button 
                        className={`timeline-button ${selectedTimeline === row ? 'active' : ''}`}
                        onClick={() => handleViewTimeline(row)}
                      >
                        {selectedTimeline === row ? 'Hide Timeline' : 'View Timeline'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTimeline && timelineData && (
        <div className="timeline-section">
          <h3 className="timeline-title">Usage Timeline</h3>
          
          <div className="timeline-flow">
            <div className="timeline-row">
              <div className={`timeline-stage ${hasFailedItems(timelineData) ? 'has-down-arrow' : ''}`}>
                <div className="stage-box">
                  <div className="stage-header">Usage Items</div>
                  <div className="stage-content">
                    <div className="stage-metric">
                      <span className="metric-label">Quantity</span>
                      <span className="metric-value">{timelineData.usageItems.quantity.toFixed(2)}</span>
                    </div>
                    <div className="stage-metric">
                      <span className="metric-label">Total Price</span>
                      <span className="metric-value">{timelineData.usageItems.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                {hasFailedItems(timelineData) && <div className="arrow-down-to-failed"></div>}
                <div className="arrow-connector"></div>
              </div>

              <div className={`timeline-stage ${hasFailedItems(timelineData) ? 'has-down-arrow' : ''}`}>
                <div className="stage-box">
                  <div className="stage-header">Usage Items Rated</div>
                  <div className="stage-content">
                    <div className="stage-metric">
                      <span className="metric-label">Quantity</span>
                      <span className="metric-value">{timelineData.usageItemsRated.quantity.toFixed(2)}</span>
                    </div>
                    <div className="stage-metric">
                      <span className="metric-label">Total Price</span>
                      <span className="metric-value">{timelineData.usageItemsRated.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                {hasFailedItems(timelineData) && <div className="arrow-down-to-failed-short"></div>}
                <div className="arrow-connector"></div>
              </div>

              <div className="timeline-stage">
                <div className="stage-box">
                  <div className="stage-header">Usage Billing Items</div>
                  <div className="stage-content">
                    <div className="stage-metric">
                      <span className="metric-label">Quantity</span>
                      <span className="metric-value">{timelineData.usageBillingItems.quantity.toFixed(2)}</span>
                    </div>
                    <div className="stage-metric">
                      <span className="metric-label">Total Price</span>
                      <span className="metric-value">{timelineData.usageBillingItems.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {hasFailedItems(timelineData) && (
              <div className="timeline-row timeline-row-failed">
                <div className="failed-box-wrapper">
                  <div className="stage-box failed">
                    <div className="stage-header">Usage Items Failed</div>
                    <div className="stage-content">
                      <div className="stage-metric">
                        <span className="metric-label">Quantity</span>
                        <span className="metric-value">{timelineData.usageItemsFailed.quantity.toFixed(2)}</span>
                      </div>
                      <div className="stage-metric">
                        <span className="metric-label">Total Price</span>
                        <span className="metric-value">{timelineData.usageItemsFailed.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageAggregation;

