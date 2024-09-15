"use strict";

/**
 * Custom invitation controller
 */
module.exports = {
  async createInvitation(ctx) {
    try {
      const {
        FullName,
        Country,
        ConsulateAddress,
        RegistrationCode,
        EventName,
      } = ctx.request.body;

      // Step 1: Check if the RegistrationCode exists in the 'registrations' collection
      const existingRegistration = await strapi.db
        .query("api::registration.registration")
        .findOne({
          where: { RegistrationCode },
        });
      console.log('existingRegistration', existingRegistration)

      if (!existingRegistration) {
        // If RegistrationCode does not exist in 'registrations', return an error
        return ctx.badRequest("Registration code not found. Please register first.");
      }

      // Step 2: Check if the RegistrationCode already exists in the 'invitations' collection
      const existingInvitation = await strapi.db
        .query("api::invitation.invitation")
        .findOne({
          where: { RegistrationCode },
        });

      console.log('existingInvitation', existingInvitation)

      if (existingInvitation) {
        // If RegistrationCode is already used in 'invitations', return an error
        return ctx.badRequest("Registration code is already used for an invitation.");
      }

      // Step 3: Create a new invitation entry
      const invitation = await strapi.db
        .query("api::invitation.invitation")
        .create({
          data: {
            FullName,
            Country,
            ConsulateAddress,
            RegistrationCode,
            EventName,
            publishedAt: new Date(),
          },
        });

      // Step 4: Respond with success
      ctx.send({
        message: "Invitation request submitted successfully!",
        invitation,
      });
    } catch (error) {
      // Log the error and send a 400 error with the error message
      console.error("Error occurred while processing invitation request:", error);
      ctx.badRequest(error.message || "An error occurred while processing the invitation request.");
    }
  },
};