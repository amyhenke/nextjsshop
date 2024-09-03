import { z } from "zod"

export const QueryValidator = z.object({
    category: z.string().optional(),
    sort: z.enum(["asc", "desc"]).optional(),
    limit: z.number().optional(),
})

// called with T so no conflict with the schema. T for type
export type TQueryValidator = z.infer<typeof QueryValidator>
