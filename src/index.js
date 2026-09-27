import { agents } from "./agents.js";

const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

async function askAI(env, system, user) {
  return await env.AI.run(MODEL, {
    messages: [
      {
        role: "system",
        content: system
      },
      {
        role: "user",
        content: user
      }
    ]
  });
}

function getText(result) {
  if (result?.response) return result.response;

  if (result?.choices?.[0]?.message?.content) {
    return result.choices[0].message.content;
  }

  return JSON.stringify(result);
}

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
        const result = await askAI(
          env,
          "أنت الذكاء الاصطناعي الرئيسي لنظام أبو العيشة. ساعد في تحليل فرص البيع والشراء وتحليل السوق والربح.",
          "عرّف نفسك باختصار."
        );

        return Response.json(result);
      } catch (error) {
        return Response.json({
          error: "حدث خطأ في الذكاء الاصطناعي",
          details: error.message
        }, { status: 500 });
      }
    }

    if (url.pathname === "/task") {
      try {
        const task =
          url.searchParams.get("task") ||
          "ابحث عن فرصة منتج منخفض التكلفة يمكن اختبار الطلب عليه قبل شراء كمية كبيرة.";

        const hunter = await askAI(
          env,
          "أنت الباحث في نظام أبو العيشة. ابحث فكرياً عن فرص بيع مناسبة للمهمة، واذكر المنتج والزبائن المحتملين والافتراضات.",
          task
        );

        const hunterText = getText(hunter);

        const market = await askAI(
          env,
          "أنت محلل السوق في نظام أبو العيشة. حلل فرصة البيع التي قدمها الباحث، واذكر الطلب المحتمل والمنافسة والمخاطر وما يحتاج إلى اختبار.",
          hunterText
        );

        const marketText = getText(market);

        const profit = await askAI(
          env,
          "أنت محلل الربح في نظام أبو العيشة. حلل التكلفة وسعر البيع والربح والهامش والمخاطر. إذا لم توجد أسعار حقيقية، صرّح بوضوح أن الأرقام تقديرية.",
          `المهمة:
${task}

نتيجة الباحث:
${hunterText}

تحليل السوق:
${marketText}`
        );

        const profitText = getText(profit);

        const manager = await askAI(
          env,
          "أنت المدير الرئيسي لأبو العيشة. اجمع نتائج الباحث والسوق والربح في قرار واضح. فرّق بين الفكرة والفرضية والمعلومة المدعومة وما يحتاج إلى اختبار. لا تدّعي امتلاك بيانات سوق حقيقية إذا لم يتم توفيرها.",
          `المهمة:
${task}

الباحث:
${hunterText}

السوق:
${marketText}

الربح:
${profitText}`
        );

        return Response.json({
          system: "أبو العيشة",
          task,
          workflow: [
            "الباحث",
            "محلل السوق",
            "محلل الربح",
            "المدير"
          ],
          result: {
            hunter: hunterText,
            market: marketText,
            profit: profitText,
            manager: getText(manager)
          }
        });
      } catch (error) {
        return Response.json({
          error: "فشل تنفيذ المهمة",
          details: error.message
        }, { status: 500 });
      }
    }

    return Response.json({
      error: "المسار غير موجود",
      available: ["/", "/agents", "/ai", "/task"]
    }, { status: 404 });
  }
};