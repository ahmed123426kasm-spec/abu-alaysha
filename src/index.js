import { agents } from "./agents.js";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return Response.json({
        name: "أبو العيشة",
        status: "يعمل",
        message: "نظام أبو العيشة جاهز",
        agents: agents.length,
        available_agents: agents
      });
    }

    if (url.pathname === "/agents") {
      return Response.json(agents);
    }

    return Response.json({
      error: "المسار غير موجود",
      available: ["/", "/agents"]
    }, { status: 404 });
  }
};
