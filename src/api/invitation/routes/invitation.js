module.exports = {
  routes: [
    {
      method: "POST",
      path: "/invitation-request",
      handler: "invitation.createInvitation",
      config: {
        auth: false, // You can add authentication if needed
      },
    },
  ],
};
