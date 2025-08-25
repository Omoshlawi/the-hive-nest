import z from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).nonnegative().optional(), // TODO MOVE TO CONFIG CLASS PAGINATION
  limit: z.coerce.number().nonnegative().optional(), // TODO Same here
});

export const orderQuerySchema = z.object({
  orderBy: z
    .string()
    .regex(/^-?[a-zA-Z_][a-zA-Z0-9_.]*(?:,-?[a-zA-Z_][a-zA-Z0-9_.]*)*$/)
    .optional(), // TODO Add regex for validating order by
});

export const customRepresentationQuerySchema = z.object({
  v: z
    .string()
    .optional()
    .refine(validateRepString, { error: 'Invalid custom representation' }), // TODO Add regex validator
});

export const sortAndRepresentationSchema = z.object({
  ...orderQuerySchema.shape,
  ...customRepresentationQuerySchema.shape,
});

export const queryBuilderSchema = z.object({
  ...paginationQuerySchema.shape,
  ...orderQuerySchema.shape,
  ...customRepresentationQuerySchema.shape,
});

function hasBalancedParentheses(str: string): boolean {
  let count = 0;
  for (const char of str) {
    if (char === '(') count++;
    if (char === ')') count--;
    if (count < 0) return false;
  }
  return count === 0;
}
// TODO Properly refine the validations
export const REP_STRING_REGEX_COMPREHENSIVE =
  /^[a-zA-Z_][a-zA-Z0-9_]*:(?:include|omit|select)\([^)]+\)$/;
export function validateRepString(repString: string): boolean {
  // First check basic structure
  // if (!REP_STRING_REGEX_COMPREHENSIVE.test(repString.trim())) {
  //   return false;
  // }

  // Additional validation for balanced parentheses
  return hasBalancedParentheses(repString);
}
