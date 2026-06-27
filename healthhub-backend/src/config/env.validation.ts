import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(4000),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  JWT_EXPIRATION: Joi.string().optional(),

  MYSQL_HOST: Joi.string().default('localhost'),
  MYSQL_PORT: Joi.number().default(3306),
  MYSQL_USER: Joi.string().required(),
  MYSQL_PASSWORD: Joi.string().required(),
  MYSQL_DATABASE: Joi.string().optional(),
  MYSQL_DB: Joi.string().optional().default('healthhub'),

  MONGO_URI: Joi.string().uri().required(),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),

  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),

  EMAIL_USER: Joi.string().email().required(),
  EMAIL_PASS: Joi.string().required(),
  MAIL_USER: Joi.string().email().optional(),
  MAIL_PASS: Joi.string().optional(),

  KAFKA_BROKERS: Joi.string().default('localhost:9092'),

  ADMIN_EMAIL: Joi.string().email().default('admin@healthhub.com'),
  ADMIN_PASSWORD: Joi.string().min(8).default('admin123'),

  ANTHROPIC_API_KEY: Joi.string().optional().allow(''),
  GEMINI_API_KEY: Joi.string().optional().allow(''),
});
