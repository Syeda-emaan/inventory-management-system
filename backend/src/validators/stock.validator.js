const { z } = require('zod');

module.exports = {
  stockSchema: z.object({
    change_type: z.enum(['IN', 'OUT', 'ADJUST']),
    quantity: z.coerce.number().int().min(0),
    reason: z.string().max(255).optional(),
  }),
};