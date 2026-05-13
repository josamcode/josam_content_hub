const bcrypt = require("bcrypt");

const prisma = require("../src/config/prisma");
const env = require("../src/config/env");

async function main() {
  const passwordHash = await bcrypt.hash(env.seedUserPassword, 12);

  await prisma.user.upsert({
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
