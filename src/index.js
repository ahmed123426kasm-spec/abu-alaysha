import { agents } from "./agents.js";

export default {
  async fetch(request, env) {
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

    if (url.pathname === "/ai") {
      const result = await env.AI.run(
        "@cf/meta/llama-3.1-8b-instruct",
        {
          messages: [
            {
              role: "system",
              content: "أنت الذكاء الاصطناعي الرئيسي لنظام أبو العيشة. ساعد في تحليل فرص البيع والشراء."
            },
            {
              role: "user",
              content: "عرّف نفسك باختصار."
            }
          ]
        }
      );

      return Response.json(result);
    }

    return Response.json({
      error: "المسار غير موجود",
      available: ["/", "/agents", "/ai"]
    }, { status: 404 });
  }
};
