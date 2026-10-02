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
  "أنت المدير الرئيسي لأبو العيشة. استخدم البيانات المرسلة فقط. يجب أن يكون ردك قراراً واحداً فقط من ثلاثة: \"اختبر كمية صغيرة\" أو \"ارفض المنتج\" أو \"انتقل للشراء\". بعد القرار اذكر سبباً قصيراً يعتمد على الأرقام المرسلة. لا تغيّر اسم المنتج ولا أي رقم، ولا تخترع وصفاً أو معلومات جديدة، ولا تكتب تقريراً عاماً، ولا تستخدم أي قرار خارج الخيارات الثلاثة.",         `المهمة:
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
if (url.searchParams.get("debug") === "1") return new Response(pageText);
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
if (url.pathname === "/discover") {
  try {
    const query =
      url.searchParams.get("q") ||
      "منتجات صغيرة ورخيصة وسهلة البيع";

    const result = await askAI(
      env,
      `أنت وكيل اكتشاف المنتجات في نظام أبو العيشة.
اقترح 5 منتجات حقيقية قابلة للبيع.
ركز على منتجات صغيرة، خفيفة، منخفضة التكلفة، وسهلة الشحن.
لكل منتج اذكر:
اسم المنتج:
سبب فرصة البيع:
نوع الزبون:
ما الذي يجب التحقق منه:
مهم: لا تخترع أسعاراً أو أرقام مبيعات.`,
      query
    );

    return Response.json({
      system: "أبو العيشة",
      search: query,
      discoveries: getText(result)
    });
  } catch (error) {
    return Response.json({
      error: "فشل اكتشاف المنتجات",
      details: error.message
    }, { status: 500 });
  }
}
    if (url.pathname === "/decision") {
      const product = {
        name: url.searchParams.get("name") || "",
        cost: Number(url.searchParams.get("cost") || 0),
        selling_price: Number(url.searchParams.get("selling_price") || 0),
        sold: Number(url.searchParams.get("sold") || 0),
        rating: Number(url.searchParams.get("rating") || 0),
        reviews: Number(url.searchParams.get("reviews") || 0),
        min_order: Number(url.searchParams.get("min_order") || 0)
      };

      if (!product.name) {
        return Response.json({
          system: "أبو العيشة",
          message: "أرسل بيانات المنتج لاتخاذ القرار",
          fields: [
            "name",
            "cost",
            "selling_price",
            "sold",
            "rating",
            "reviews",
            "min_order"
          ]
        });
      }

      const profit = product.selling_price - product.cost;

      const decision = {
        product: product.name,
        cost: product.cost,
        selling_price: product.selling_price,
        estimated_profit: Math.round(profit * 1000) / 1000,
        demand:
          product.sold >= 20 &&
          product.rating >= 4 &&
          product.reviews >= 20
            ? "إشارات الطلب جيدة"
            : "الطلب يحتاج اختبار",
        order_risk:
          product.min_order <= 50 ? "منخفض" :
          product.min_order <= 500 ? "متوسط" :
          "مرتفع"
      };

      let managerDecision;

if (
  product.sold >= 20 &&
  product.rating >= 4 &&
  product.reviews >= 20 &&
  product.min_order <= 50 &&
  profit > 0
) {
  managerDecision = "اختبر كمية صغيرة";
} else if (
  profit <= 0 ||
  product.rating < 4 ||
  product.reviews < 20
) {
  managerDecision = "ارفض المنتج";
} else {
  managerDecision = "اختبر كمية صغيرة";
}

      return Response.json({
        system: "أبو العيشة",
        product,
        calculations: decision,
        manager_decision: managerDecision
      });
    }
    if (url.pathname === "/product") {
      const product = {
        name: url.searchParams.get("name") || "",
        price: url.searchParams.get("price") || "",
        currency: url.searchParams.get("currency") || "",
        min_order: url.searchParams.get("min_order") || "",
        shipping: url.searchParams.get("shipping") || "",
        supplier: url.searchParams.get("supplier") || "",
        rating: url.searchParams.get("rating") || "",
        sold: url.searchParams.get("sold") || "",
        description: url.searchParams.get("description") || ""
      };

      if (!product.name) {
        return Response.json({
          system: "أبو العيشة",
          message: "أرسل بيانات المنتج",
          fields: [
            "name",
            "price",
            "currency",
            "min_order",
            "shipping",
            "supplier",
            "rating",
            "sold",
            "description"
          ]
        });
      }

      try {
                const prices = String(product.price || "");

        const numbers = prices.match(/\d+(?:\.\d+)?/g) || [];

        const cost = numbers.length
          ? Number(numbers[0])
          : null;

        const analysis = {
          cost_per_piece: cost,
          suggested_selling_price: cost ? Math.round(cost * 2.5 * 1000) / 1000 : null,
          estimated_profit: cost ? Math.round(cost * 1.5 * 1000) / 1000 : null,
          margin_percent: cost ? 60 : null,
          risk: product.sold && Number(product.sold) < 10
            ? "المبيعات الحالية منخفضة وتحتاج اختبار الطلب"
            : "غير متوفر",
          test_needed: "اختبار الطلب وسعر البيع والشحن قبل شراء كمية كبيرة"
        };

           const result = {
          name: product.name,
          cost_per_piece: cost,
          suggested_selling_price: cost ? Math.round(cost * 2.5 * 1000) / 1000 : "غير متوفر",
          estimated_profit: cost ? Math.round(cost * 1.5 * 1000) / 1000 : "غير متوفر",
          margin_percent: cost ? 60 : "غير متوفر",
          risk: product.sold && Number(product.sold) < 10
            ? "المبيعات الحالية منخفضة وتحتاج اختبار الطلب"
            : "غير متوفر",
          test_needed: "اختبار الطلب وسعر البيع والشحن قبل شراء كمية كبيرة"
        };

        return Response.json({
          system: "أبو العيشة",
          product,
          analysis: getText(result)
        });
      } catch (error) {
        return Response.json({
          error: "فشل تحليل المنتج",
          details: error.message
        }, { status: 500 });
      }
    }
    if (url.pathname === "/demand") {
      const product = {
        name: url.searchParams.get("name") || "",
        cost: Number(url.searchParams.get("cost") || 0),
        selling_price: Number(url.searchParams.get("selling_price") || 0),
        sold: Number(url.searchParams.get("sold") || 0),
        rating: Number(url.searchParams.get("rating") || 0),
        reviews: Number(url.searchParams.get("reviews") || 0),
        min_order: Number(url.searchParams.get("min_order") || 0)
      };

      if (!product.name) {
        return Response.json({
          system: "أبو العيشة",
          message: "أرسل بيانات المنتج لاختبار الطلب",
          fields: [
            "name",
            "cost",
            "selling_price",
            "sold",
            "rating",
            "reviews",
            "min_order"
          ]
        });
      }

      const signals = {
        sales_signal:
          product.sold >= 100 ? "قوي" :
          product.sold >= 20 ? "متوسط" :
          "ضعيف",

        rating_signal:
          product.rating >= 4.5 ? "جيد جداً" :
          product.rating >= 4 ? "جيد" :
          "ضعيف",

        review_signal:
          product.reviews >= 100 ? "قوي" :
          product.reviews >= 20 ? "متوسط" :
          "ضعيف",

        order_risk:
          product.min_order <= 50 ? "منخفض" :
          product.min_order <= 500 ? "متوسط" :
          "مرتفع"
      };

      return Response.json({
        system: "أبو العيشة",
        product,
        demand_test: signals,
        decision:
          product.sold >= 20 &&
          product.rating >= 4 &&
          product.reviews >= 20 &&
          product.min_order <= 500
            ? "يستحق اختبار البيع بكمية صغيرة"
            : "لا تشتري كمية كبيرة قبل اختبار الطلب"
      });
    }
    return Response.json({
      error: "المسار غير موجود",
      available: ["/", "/agents", "/ai", "/task", "/research"]
    }, { status: 404 });
  }
};