const prisma = require("../../config/prisma");

const DEFAULT_PROFILE = {
  audience:
    "مطورون عرب مبتدئون ومتوسطون يريدون تعلم البرمجة وهندسة البرمجيات وبناء مشاريع حقيقية تساعدهم في الشغل والبيع.",
  tone:
    "لهجة مصرية واضحة ومباشرة، عملية، واثقة، بدون مبالغة أو كلام تسويقي فارغ.",
  language: "العربية",
  contentGoal:
    "بناء الثقة، تعليم البرمجة وهندسة البرمجيات بشكل عملي، ودعم بيع خدمات تطوير الويب والكورسات المستقبلية.",
  ctaStyle:
    "دعوة بسيطة ومفيدة لاتخاذ إجراء. تجنب البيع المباشر المزعج، واستخدم CTA واضح فقط عندما يكون مناسبًا للمحتوى.",
  forbiddenWords: [
    "ثوري",
    "لا يصدق",
    "سر خطير",
    "هاك سحري",
    "اكسب ملايين",
    "اربح بسرعة",
    "نجاح مضمون",
    "100%",
    "لن تفشل أبدًا",
    "يغير قواعد اللعبة",
  ],
  hashtagBank: [
    "برمجة",
    "تطوير_ويب",
    "هندسة_برمجيات",
    "مشاريع_برمجية",
    "تعلم_البرمجة",
    "جوسام_كود",
  ],
  servicesToPromote: [
    "تطوير مواقع وتطبيقات ويب",
    "أنظمة أعمال ولوحات تحكم",
    "ARA Financial",
    "كورسات هندسة البرمجيات",
  ],
  courseTopics: [
    "أساسيات البرمجة",
    "تطوير Full-stack",
    "هندسة البرمجيات",
    "بناء مشاريع حقيقية",
    "الحصول على عملاء",
  ],
  platformInstructions: {
    youtube:
      "العنوان والوصف والوسوم يجب أن تكون واضحة وقابلة للبحث. ركّز على كلمات مفتاحية عربية مفهومة بدون حشو.",
    instagram:
      "الكابشن يكون مختصر وجذاب. وضّح الفكرة الأساسية في أول سطر.",
    tiktok:
      "الكابشن يكون قصيرًا ومبنيًا على hook قوي. ركّز على أول ثانية وفكرة واحدة واضحة.",
    facebook:
      "الكابشن يمكن أن يكون أطول قليلًا وأكثر شرحًا، ومناسبًا للنقاش وبناء الثقة.",
  },
};

const profileSelect = {
  id: true,
  audience: true,
  tone: true,
  language: true,
  contentGoal: true,
  ctaStyle: true,
  forbiddenWords: true,
  hashtagBank: true,
  servicesToPromote: true,
  courseTopics: true,
  platformInstructions: true,
  createdAt: true,
  updatedAt: true,
};

async function getOrCreateProfile(userId) {
  const existing = await prisma.aiBrandProfile.findUnique({
    where: { userId },
    select: profileSelect,
  });

  if (existing) return existing;

  return prisma.aiBrandProfile.create({
    data: {
      userId,
      ...DEFAULT_PROFILE,
    },
    select: profileSelect,
  });
}

async function updateProfile(userId, payload) {
  const existing = await prisma.aiBrandProfile.findUnique({
    where: { userId },
  });

  if (!existing) {
    return prisma.aiBrandProfile.create({
      data: {
        userId,
        ...DEFAULT_PROFILE,
        ...payload,
      },
      select: profileSelect,
    });
  }

  return prisma.aiBrandProfile.update({
    where: { userId },
    data: payload,
    select: profileSelect,
  });
}

module.exports = {
  DEFAULT_PROFILE,
  getOrCreateProfile,
  updateProfile,
};
