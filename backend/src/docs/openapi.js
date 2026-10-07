const id = { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1 };
const imageId = { name: 'imageId', in: 'path', required: true, schema: { type: 'integer' }, example: 1 };
const page = { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } };
const limit = { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } };
const search = { name: 'search', in: 'query', schema: { type: 'string' } };

const json = (example) => ({ required: true, content: { 'application/json': { example } } });
const ok = { 200: { description: 'Success' } };
const created = { 201: { description: 'Created' } };

const productFilters = [
  search,
  { name: 'category_id', in: 'query', schema: { type: 'integer' } },
  { name: 'supplier_id', in: 'query', schema: { type: 'integer' } },
  { name: 'min_price', in: 'query', schema: { type: 'number' } },
  { name: 'max_price', in: 'query', schema: { type: 'number' } },
  { name: 'low_stock', in: 'query', schema: { type: 'boolean' } },
];

const crud = (tag, path, createBody, updateBody) => ({
  [path]: {
    get: { tags: [tag], summary: `List ${tag}`, parameters: [page, limit, search], responses: ok },
    post: { tags: [tag], summary: `Create ${tag}`, requestBody: json(createBody), responses: created },
  },
  [`${path}/{id}`]: {
    get: { tags: [tag], summary: `Get ${tag} by id`, parameters: [id], responses: ok },
    put: { tags: [tag], summary: `Update ${tag}`, parameters: [id], requestBody: json(updateBody), responses: ok },
    delete: { tags: [tag], summary: `Delete ${tag}`, parameters: [id], responses: ok },
  },
});

module.exports = {
  openapi: '3.0.3',
  info: { title: 'Inventory Management API', version: '1.0.0', description: 'Products, categories, suppliers, stock, history, images and CSV export.' },
  servers: [{ url: 'http://localhost:3000/api' }],
  tags: [
    { name: 'System' }, { name: 'Categories' }, { name: 'Suppliers' },
    { name: 'Products' }, { name: 'Stock' }, { name: 'Images' },
  ],
  paths: {
    '/health': { get: { tags: ['System'], summary: 'Health check', responses: ok } },
    '/dashboard': { get: { tags: ['System'], summary: 'Dashboard stats', responses: ok } },

    ...crud('Categories', '/categories',
      { name: 'Toys' }, { name: 'Toys Updated' }),
    ...crud('Suppliers', '/suppliers',
      { name: 'ABC Traders', email: 'abc@example.com', phone: '0300-1234567', address: 'Hazro, Pakistan' },
      { phone: '0311-7654321' }),

    '/products': {
      get: {
        tags: ['Products'], summary: 'List products (pagination, search, filter, sort)',
        parameters: [
          page, limit, ...productFilters,
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['name', 'sku', 'price', 'quantity', 'created_at'] } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: ok,
      },
      post: {
        tags: ['Products'], summary: 'Create product',
        requestBody: json({
          sku: 'TEST-001', name: 'Test Product', description: 'Sample', price: 99.5,
          category_id: 1, quantity: 25, reorder_level: 10,
          suppliers: [{ supplier_id: 1, supply_price: 80 }],
        }),
        responses: created,
      },
    },
    '/products/{id}': {
      get: { tags: ['Products'], summary: 'Get product (images + suppliers)', parameters: [id], responses: ok },
      put: { tags: ['Products'], summary: 'Update product', parameters: [id], requestBody: json({ name: 'Renamed Product', price: 120 }), responses: ok },
      delete: { tags: ['Products'], summary: 'Soft delete product', parameters: [id], responses: ok },
    },
    '/products/export/csv': {
      get: { tags: ['Products'], summary: 'Export products as CSV (streamed, filters supported)', parameters: productFilters, responses: ok },
    },

    '/products/{id}/stock': {
      post: {
        tags: ['Stock'], summary: 'Stock IN / OUT / ADJUST (transaction)', parameters: [id],
        requestBody: json({ change_type: 'IN', quantity: 20, reason: 'Purchase' }),
        responses: { ...created, 400: { description: 'Insufficient stock' } },
      },
    },
    '/products/{id}/history': {
      get: { tags: ['Stock'], summary: 'Inventory history of a product', parameters: [id, page, limit], responses: ok },
    },
    '/stock/history': {
      get: { tags: ['Stock'], summary: 'All stock movements', parameters: [page, limit], responses: ok },
    },

    '/products/{id}/images': {
      post: {
        tags: ['Images'], summary: 'Upload images (field name: images, max 5)', parameters: [id],
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: {
            type: 'object',
            properties: { images: { type: 'array', items: { type: 'string', format: 'binary' } } },
          } } },
        },
        responses: created,
      },
    },
    '/products/{id}/images/{imageId}/primary': {
      patch: { tags: ['Images'], summary: 'Set primary image', parameters: [id, imageId], responses: ok },
    },
    '/products/{id}/images/{imageId}': {
      delete: { tags: ['Images'], summary: 'Delete image', parameters: [id, imageId], responses: ok },
    },
  },
};