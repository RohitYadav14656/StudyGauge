import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().trim().required().min(2).max(50),
  email: Joi.string().trim().email().required(),
  password: Joi.string()
    .min(8)
    .required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
    .messages({
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  preferredStudyTime: Joi.string().valid('morning', 'afternoon', 'evening', 'night'),
  availableDailyHours: Joi.number().min(0).max(24),
  preparationLevel: Joi.string().valid('beginner', 'intermediate', 'advanced'),
  targetInformation: Joi.string().allow('', null),
});
