import { z } from "@hono/zod-openapi";
import { commonErrorResponses } from "@/lib/common-resonse";
import { createRouteConfig } from "@/lib/route-config";
import { isPublicAccess } from "@/middlewares/guard/is-public-access";
import {
  createTodoBodySchema,
  todoSchema,
  updateTodoBodySchema,
} from "@/modules/todo/schema";

const todoRoutes = {
  listTodos: createRouteConfig({
    operationId: "listTodos",
    method: "get",
    path: "/",
    guard: [isPublicAccess],
    tags: ["todo"],
    summary: "List todos",
    description: "Returns a list of todos",
    request: {
      query: z.object({
        q: z.string().optional(),
        completed: z.coerce.boolean().optional(),
      }),
    },
    responses: {
      200: {
        description: "Todos",
        content: {
          "application/json": {
            schema: z.array(todoSchema),
          },
        },
      },
      ...commonErrorResponses,
    },
  }),
  getTodo: createRouteConfig({
    operationId: "getTodo",
    method: "get",
    path: "/:id",
    guard: [isPublicAccess],
    tags: ["todo"],
    summary: "Get a todo by id",
    description: "Returns a todo",
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      200: {
        description: "Todo",
        content: {
          "application/json": {
            schema: todoSchema,
          },
        },
      },
      ...commonErrorResponses,
    },
  }),
  createTodo: createRouteConfig({
    operationId: "createTodo",
    method: "post",
    path: "/",
    guard: [isPublicAccess],
    tags: ["todo"],
    summary: "Create a todo",
    description: "Creates and returns a todo",
    request: {
      body: {
        content: {
          "application/json": {
            schema: createTodoBodySchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Todo created",
        content: {
          "application/json": {
            schema: todoSchema,
          },
        },
      },
      ...commonErrorResponses,
    },
  }),
  updateTodo: createRouteConfig({
    operationId: "updateTodo",
    method: "put",
    path: "/:id",
    guard: [isPublicAccess],
    tags: ["todo"],
    summary: "Update a todo",
    description: "Updates and returns a todo",
    request: {
      params: z.object({ id: z.string() }),
      body: {
        content: {
          "application/json": {
            schema: updateTodoBodySchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Todo updated",
        content: {
          "application/json": {
            schema: todoSchema,
          },
        },
      },
      ...commonErrorResponses,
    },
  }),
  deleteTodo: createRouteConfig({
    operationId: "deleteTodo",
    method: "delete",
    path: "/:id",
    guard: [isPublicAccess],
    tags: ["todo"],
    summary: "Delete a todo",
    description: "Deletes a todo",
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      204: {
        description: "Todo deleted",
      },
      ...commonErrorResponses,
    },
  }),
} as const;

export default todoRoutes;
