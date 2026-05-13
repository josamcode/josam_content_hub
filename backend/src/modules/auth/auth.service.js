const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const env = require("../../config/env");
const prisma = require("../../config/prisma");
const ApiError = require("../../utils/apiError");

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
};

function signAuthToken(userId) {
  if (!env.jwtSecret) {
    throw new ApiError(500, "Server configuration error");
  }

  return jwt.sign({ id: userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(401, "Wrong email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Wrong email or password");
  }

  const token = signAuthToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

async function getSafeUserById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  });
}

module.exports = {
  login,
  getSafeUserById,
};
