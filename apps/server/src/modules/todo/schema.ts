import { z } from "@hono/zod-openapi";

export const todoSchema = z.object({
  id: z.string().openapi({ type: "string" }),
  title: z.string(),
  description: z.string().nullable().optional(),
  completed: z.boolean(),
  createdAt: z.string().openapi({ type: "string", format: "date-time" }),
  updatedAt: z.string().openapi({ type: "string", format: "date-time" }),
});

export const createTodoBodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  completed: z.coerce.boolean().optional(),
});

export const updateTodoBodySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  completed: z.coerce.boolean().optional(),
});
