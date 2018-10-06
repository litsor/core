'use strict';

module.exports = {
  name: 'Filter list',
  description: 'Process filters, order, offset and limit on array.',
  leftSchema: {
    type: 'array',
    items: {
      title: 'Item',
      type: 'object'
    }
  },
  rightSchema: {
    type: 'object',
    properties: {
      filters: {
        title: 'Filters',
        type: 'object'
      },
      order: {
        title: 'Order',
        type: 'array',
        items: {
          title: 'Order',
          type: 'object',
          properties: {
            field: {
              title: 'Field',
              type: 'string',
              maxLength: 255
            },
            direction: {
              title: 'Direction',
              type: 'string',
              default: 'ASC',
              enum: ['ASC', 'DESC']
            }
          },
          required: ['field']
        }
      },
      // offset: {
      //   title: 'Offset',
      //   type: 'integer',
      //   minimum: 0
      // },
      // limit: {
      //   type: 'Limit',
      //   type: 'integer',
      //   minimum: 1
      // }
    }
  },
  binary: (items, {filters = {}, order = [], offset = 0, limit = Infinity}) => {
    items = items.filter(item => Object.keys(filters).reduce((keep, field) => keep && item[field] === filters[field], true));

    order.forEach(({field, direction}) => {
      const ascending = direction !== 'DESC';
      items = items.sort((a, b) => {
        const aValue = a[field] || 0;
        const bValue = b[field] || 0;
        let result = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          result = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          result = aValue - bValue;
        }
        if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          result = Number(aValue) - Number(bValue);
        }
        return ascending ? result : -result;
      });
    });

    const count = items.length;

    items = items.slice(offset, offset + limit);

    return {count, items};
  }
};
