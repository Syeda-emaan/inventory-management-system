const { z } = require('zod');

const supplierSchema = z.object({
  name: z.string().trim().min(1).max(150),
  email: z.string().trim().email().nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  address: z.string().trim().nullable().optional(),
});

module.exports = { supplierSchema, supplierUpdateSchema: supplierSchema.partial() };