const express = require('express');
const router = express.Column = express.Router();
const mongoose = require('mongoose');
const { redisClient } = require('./redis');
const { kafka } = require('./kafka');
const asyncHandler = require('./utils/asyncHandler');

router.get('/health', asyncHandler(async (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
        services: {
            mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            redis: redisClient.isOpen ? 'connected' : 'disconnected',
        }
    };

    try {
        // Simple Kafka health check
        const admin = kafka.admin();
        await admin.connect();
        await admin.listTopics();
        await admin.disconnect();
        healthcheck.services.kafka = 'connected';
    } catch (e) {
        healthcheck.services.kafka = 'error';
        healthcheck.message = 'DEGRADED';
    }

    const status = healthcheck.message === 'OK' ? 200 : 503;
    res.status(status).json(healthcheck);
}));

module.exports = router;
