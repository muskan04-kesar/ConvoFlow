const Joi = require('joi');

const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(5000),
    MONGO_URI: Joi.string().required().description('MongoDB connection string'),
    REDIS_URL: Joi.string().required().description('Redis connection string'),
    KAFKA_BROKER: Joi.string().required().description('Kafka broker address'),
    KAFKA_TOPIC: Joi.string().default('chat-messages'),
    FRONTEND_URL: Joi.string().default('http://localhost:5173'),
}).unknown().required();

const validateEnv = () => {
    const { error, value } = envSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

    if (error) {
        throw new Error(`Config validation error: ${error.message}`);
    }

    return value;
};

module.exports = validateEnv;
