// Path: src/api/subscriber/controllers/subscriber.js

'use strict';

/**
 * subscriber controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::subscriber.subscriber', ({ strapi }) => ({
  async subscribe(ctx) {
    // @ts-ignore
    const { email } = ctx.request.body;

    if (!email) {
      return ctx.badRequest('Email is required');
    }

    // Check if the email already exists
    const existingSubscriber = await strapi.entityService.findMany('api::subscriber.subscriber', {
      filters: { Email: email },
    });

    if (existingSubscriber.length > 0) {
      return ctx.badRequest('Email already subscribed');
    }

    // Create new subscriber
    const newSubscriber = await strapi.entityService.create('api::subscriber.subscriber', {
      data: {
        Email: email,
        publishedAt: new Date(),
      },
    });

    return ctx.send({
      message: 'Subscribed successfully',
      subscriber: newSubscriber,
    });
  },
}));