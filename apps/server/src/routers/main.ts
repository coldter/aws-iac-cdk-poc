import todoHandler from "@/modules/todo/handler";
import baseApp from "@/server";

export const app = baseApp.route("/api/todo", todoHandler);
