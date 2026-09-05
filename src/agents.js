export const agents = [
  { id: "manager", name: "المدير", role: "يدير المهمة ويوزعها على الوكلاء." },
  { id: "hunter", name: "الباحث", role: "يبحث عن فرص المنتجات والبيع." },
  { id: "profit", name: "محلل الربح", role: "يحسب التكلفة والربح والمخاطر." },
  { id: "market", name: "محلل السوق", role: "يحلل الطلب والمنافسة." },
  { id: "suppliers", name: "الموردين", role: "ينظم بيانات الموردين." },
  { id: "marketing", name: "التسويق", role: "يجهز عروض وإعلانات البيع." },
  { id: "support", name: "خدمة الزبائن", role: "يدير الردود وخدمة العملاء." },
  { id: "accounting", name: "الحسابات", role: "يتابع التكاليف والأرباح." },
  { id: "memory", name: "الذاكرة", role: "يحفظ معلومات المشروع والقرارات." }
];

export function getAgent(id) {
  return agents.find((agent) => agent.id === id) || null;
}
