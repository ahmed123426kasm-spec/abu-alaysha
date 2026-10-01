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

function cleanHTML(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
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

    if (url.pathname === "/research") {
      try {
        const productURL = url.searchParams.get("url");

        if (!productURL) {
          return Response.json({
            error: "أرسل رابط المنتج",
            example: "/research?url=https://example.com/product"
          }, { status: 400 });
        }

        const target = new URL(productURL);

        const allowedDomains = [
          "alibaba.com",
          "aliexpress.com"
        ];

        const allowed = allowedDomains.some(
          domain =>
            target.hostname === domain ||
            target.hostname.endsWith("." + domain)
        );

        if (!allowed) {
          return Response.json({
            error: "هذا الموقع غير مدعوم حالياً",
            supported: allowedDomains
          }, { status: 400 });
        }

   const response = await fetch(target.toString(), {
  redirect: "follow",
  headers: {
    "User-Agent": "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml"
  }
});

        if (!response.ok) {
          return Response.json({
            error: "تعذر قراءة صفحة المنتج",
            status: response.status
          }, { status: 502 });
        }

        const html = await response.text();
        const pageText = cleanHTML(html).slice(0, 50000);
        const analysis = await askAI(
          env,
          `أنت محلل المنتجات في نظام أبو العيشة.
حلل بيانات صفحة المنتج التي تم جلبها من الإنترنت.
استخرج فقط المعلومات الموجودة فعلياً في النص.
إذا لم تجد معلومة، اكتب "غير متوفر".
لا تخترع أسعاراً أو أرقاماً.

أخرج النتيجة بهذا الترتيب:
اسم المنتج:
السعر:
العملة:
الوصف:
الحد الأدنى للطلب:
معلومات الشحن:
معلومات إضافية:
ما الذي يحتاج إلى تحقق:`,
          pageText
        );

        return Response.json({
          system: "أبو العيشة",
          source: target.toString(),
          fetched: true,
          analysis: getText(analysis)
        });
      } catch (error) {
        return Response.json({
          error: "فشل البحث في صفحة المنتج",
          details: error.message
        }, { status: 500 });
      }
    }

    return Response.json({
      error: "المسار غير موجود",
      available: ["/", "/agents", "/ai", "/task", "/research"]
    }, { status: 404 });
  }
};