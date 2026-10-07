const { z } = require('zod');

const categorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  parent_id: z.coerce.number().int().positive().nullable().optional(),
});

module.exports = { categorySchema, categoryUpdateSchema: categorySchema.partial() };