import { randomUUID } from "node:crypto";
import { OpenAPIHono } from "@hono/zod-openapi";
import { and, desc, eq, like, type SQL } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "@/db";
import { todo } from "@/db/schema/todo";
import type { Env } from "@/lib/context";
import todoRoutes from "@/modules/todo/routes";
import { defaultHook } from "@/utils/default-hook";

const app = new OpenAPIHono<Env>({ defaultHook });

function serializeTodo(row: typeof todo.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    completed: row.completed,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt as unknown as string).toISOString(),
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : new Date(row.updatedAt as unknown as string).toISOString(),
  };
}

/**
 * Handler
 */
const todoHandler = app
  .openapi(todoRoutes.listTodos, async (c) => {
    const { q, completed } = c.req.valid("query");

    const conditions: SQL[] = [];
    if (typeof q === "string" && q.length > 0) {
      const pattern = `%${q}%`;
      conditions.push(like(todo.title, pattern));
    }
    if (typeof completed === "boolean") {
      conditions.push(eq(todo.completed, completed));
    }

    let rows: (typeof todo.$inferSelect)[];
    if (conditions.length === 0) {
      rows = await db.select().from(todo).orderBy(desc(todo.createdAt));
    } else if (conditions.length === 1) {
      rows = await db
        .select()
        .from(todo)
        .where(conditions[0])
        .orderBy(desc(todo.createdAt));
    } else {
      rows = await db
        .select()
        .from(todo)
        .where(and(...conditions))
        .orderBy(desc(todo.createdAt));
    }

    return c.json(rows.map(serializeTodo), 200);
  })

  .openapi(todoRoutes.getTodo, async (c) => {
    const { id } = c.req.valid("param");
    const rows = await db.select().from(todo).where(eq(todo.id, id)).limit(1);
    const row = rows.at(0);
    if (!row) {
      throw new HTTPException(404, { message: "Todo not found" });
    }
    return c.json(serializeTodo(row), 200);
  })

  .openapi(todoRoutes.createTodo, async (c) => {
    const body = c.req.valid("json");
    const newTodo = {
      id: randomUUID(),
      title: body.title,
      description: body.description ?? null,
      completed: body.completed ?? false,
    } satisfies Partial<typeof todo.$inferInsert> as typeof todo.$inferInsert;

    const inserted = await db.insert(todo).values(newTodo).returning();
    const row = inserted.at(0);
    if (!row) {
      throw new HTTPException(500, { message: "Failed to create todo" });
    }
    return c.json(serializeTodo(row), 201);
  })

  .openapi(todoRoutes.updateTodo, async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const updates: Partial<typeof todo.$inferInsert> = {};
    if (typeof body.title === "string") {
      updates.title = body.title;
    }
    if (typeof body.description === "string") {
      updates.description = body.description;
    }
    if (typeof body.completed === "boolean") {
      updates.completed = body.completed;
    }
    updates.updatedAt = new Date();

    const updated = await db
      .update(todo)
      .set(updates)
      .where(eq(todo.id, id))
      .returning();

    const row = updated.at(0);
    if (!row) {
      throw new HTTPException(404, { message: "Todo not found" });
    }
    return c.json(serializeTodo(row), 200);
  })

  .openapi(todoRoutes.deleteTodo, async (c) => {
    const { id } = c.req.valid("param");
    const deleted = await db
      .delete(todo)
      .where(eq(todo.id, id))
      .returning({ id: todo.id });
    if (!deleted.length) {
      throw new HTTPException(404, { message: "Todo not found" });
    }
    return c.json({}, 200);
  });

export default todoHandler;
