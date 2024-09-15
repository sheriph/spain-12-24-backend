module.exports = {
  routes: [
    {
      method: "POST",
      path: "/register",
      handler: "registration.createRegistration",
      config: {
        auth: false, // You can add authentication if needed
      },
    },
    {
      method: "GET",
      path: "/registrations/check",
      handler: "registration.checkRegistration",
      config: {
        auth: false,
      },
    },
  ],
};
