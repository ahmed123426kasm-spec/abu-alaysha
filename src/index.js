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
      try {
        const result = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct-fast",
          {
            messages: [
              {
                role: "system",
                content:
                  "أنت الذكاء الاصطناعي الرئيسي لنظام أبو العيشة. ساعد في تحليل فرص البيع والشراء وتحليل السوق والربح."
              },
              {
                role: "user",
                content: "عرّف نفسك باختصار."
              }
            ]
          }
        );

        return Response.json(result);
      } catch (error) {
        return Response.json({
          error: "حدث خطأ في الذكاء الاصطناعي",
          details: error.message
        }, { status: 500 });
      }
    }

    return Response.json({
      error: "المسار غير موجود",
      available: ["/", "/agents", "/ai"]
    }, { status: 404 });
  }
};