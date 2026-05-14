const bcrypt = require("bcrypt");

const prisma = require("../src/config/prisma");
const env = require("../src/config/env");
const {
  PLATFORM_ORDER,
  PLATFORM_DEFAULTS,
} = require("../src/modules/platform-settings/platformSetting.service");

async function main() {
  const passwordHash = await bcrypt.hash(env.seedUserPassword, 12);

  const user = await prisma.user.upsert({
    where: { email: env.seedUserEmail },
    update: {
      name: env.seedUserName,
      passwordHash,
    },
    create: {
      name: env.seedUserName,
      email: env.seedUserEmail,
      passwordHash,
    },
  });

  console.log(`Seeded private user: ${env.seedUserEmail}`);

  for (const platform of PLATFORM_ORDER) {
    const defaults = PLATFORM_DEFAULTS[platform];

    await prisma.platformSetting.upsert({
      where: {
        userId_platform: {
          userId: user.id,
          platform,
        },
      },
      update: {},
      create: {
        userId: user.id,
        platform,
        ...defaults,
      },
    });
  }

  console.log(`Seeded platform settings for: ${env.seedUserEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
