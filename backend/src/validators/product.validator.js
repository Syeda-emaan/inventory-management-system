const { z } = require('zod');

const supplierLink = z.object({
  supplier_id: z.coerce.number().int().positive(),
  supply_price: z.coerce.number().min(0).optional(),
});

const shape = {
  sku: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(200),
  description: z.string().nullable().optional(),
  price: z.coerce.number().min(0),
  category_id: z.coerce.number().int().positive().nullable().optional(),
  reorder_level: z.coerce.number().int().min(0),
  suppliers: z.array(supplierLink).optional(),
};

const createProductSchema = z.object({
  ...shape,
  reorder_level: shape.reorder_level.default(10),
  quantity: z.coerce.number().int().min(0).default(0),
});

// quantity update sirf stock endpoint se hogi
const updateProductSchema = z.object(shape).partial();

module.exports = { createProductSchema, updateProductSchema };