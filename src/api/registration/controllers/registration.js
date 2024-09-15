"use strict";

/**
 * Custom registration controller
 */

const SendMailClient = require("zeptomail").SendMailClient;
const puppeteer = require("puppeteer");
const JsBarcode = require("jsbarcode");
const { createCanvas } = require("canvas"); // For barcode generation
// Canvas v1
const Canvas = require("canvas");

module.exports = {
  async createRegistration(ctx) {
    try {
      const {
        FullName,
        Email,
        Organisation,
        Country,
        EventName,
        RegistrationCode,
        PaymentMethod,
        PaymentStatus,
        PaymentAmount,
      } = ctx.request.body;

      // Step 1: Check if the email already exists
      const existingEmail = await strapi.db
        .query("api::registration.registration")
        .findOne({
          where: { Email },
        });

      if (existingEmail) {
        return ctx.badRequest("Email is already registered.");
      }

      // Step 2: Create a new registration entry
      const registration = await strapi.db
        .query("api::registration.registration")
        .create({
          data: {
            FullName,
            Email,
            Organisation,
            Country,
            EventName,
            RegistrationCode,
            publishedAt: new Date(),
            PaymentMethod,
            PaymentStatus,
            PaymentAmount,
          },
        });

      // Log the registration creation success
      console.log("Registration created successfully:", registration);

      // Step 3: Generate the badge PDF using Puppeteer
      const badgePDFBuffer = await generateBadgePDF({
        name: FullName,
        organization: Organisation,
        id: RegistrationCode,
      });

      // Log the PDF generation success
      console.log("Badge PDF generated successfully for:", FullName);

      // Step 4: Send the registration confirmation email with the badge PDF attached
      await sendRegistrationConfirmationEmail({
        FullName,
        Email,
        Organisation,
        Country,
        EventName,
        RegistrationCode,
        badgePDF: badgePDFBuffer,
      });

      // Log the email sending success
      console.log("Email sent successfully to:", Email);

      // Respond with success
      ctx.send({
        message: "Registration successful!",
        registration,
      });
    } catch (error) {
      // Log the detailed error stack in the console for debugging
      console.error("Error occurred during registration process:", error);

      ctx.badRequest(error.message || "An error occurred during registration.");
    }
  },
  async checkRegistration(ctx) {
    try {
      const { email } = ctx.query;

      if (!email) {
        return ctx.badRequest("Email is required");
      }

      const registration = await strapi.entityService.findMany(
        "api::registration.registration",
        {
          filters: { Email: email },
          limit: 1,
        }
      );

      if (registration && registration.length > 0) {
        return ctx.send({ registered: true });
      } else {
        return ctx.send({ registered: false });
      }
    } catch (err) {
      return ctx.badRequest("Error checking registration", {
        moreDetails: err,
      });
    }
  },
};

// ZeptoMail configuration
const url = "api.zeptomail.com/";
const token =
  "Zoho-enczapikey wSsVR60krxDxXat1zmKsduo5ml0DAFz0FUl42gehvnapGqjGpcc4khGcU1CnTfIaQm48FmNHprp/kE1U2jNfh9krmwpVWiiF9mqRe1U4J3x17qnvhDzIWW1amhSLK4IMxQ1imWBmEMki+g==";
// @ts-ignore
const client = new SendMailClient({ url, token });

// Function to generate the badge PDF using Puppeteer
async function generateBadgePDF(visitorData) {
  try {
    // Generate barcode using JsBarcode and canvas
    // Canvas v1
    // @ts-ignore
    const canvas = createCanvas();
    JsBarcode(canvas, visitorData.id, { format: "CODE128" });
    const barcodeDataUrl = canvas.toDataURL();

    // Log the barcode data URL for debugging
    console.log("Barcode data URL:", barcodeDataUrl);

    // HTML for the badge (Front and Back)
    const badgeHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>IDTAI 2024 Attendee Badge</title>
          <style>
              body {
                  font-family: 'Roboto', sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: #f0f0f0;
              }
              .badge {
                  width: 350px;
                  height: 500px;
                  background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
                  border-radius: 20px;
                  overflow: hidden;
                  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                  position: relative;
                  margin: 20px auto;
              }
              .header {
                  background: linear-gradient(90deg, #4a90e2, #e91e63);
                  color: white;
                  padding: 20px;
                  text-align: center;
                  font-size: 18px;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 2px;
              }
              .logo {
                  font-size: 28px;
                  margin-bottom: 10px;
              }
              .logo .id { color: #4a90e2; }
              .logo .tai { color: #e91e63; }
              .logo .year { font-size: 16px; color: #ffffff; }
              .content {
                  padding: 30px;
                  text-align: center;
              }
              .name {
                  font-size: 24px;
                  font-weight: bold;
                  margin-top: 20px;
                  color: #333;
              }
              .organization {
                  font-size: 18px;
                  color: #666;
                  margin-top: 10px;
              }
              .barcode {
                  width: 200px;
                  height: 80px;
                  margin: 50px auto;
                  background-color: #fff;
                  display: flex;
                  align-items: center;
                  justify-content: center;
              }
              .footer {
                  background-color: #4a90e2;
                  color: white;
                  padding: 15px;
                  position: absolute;
                  bottom: 0;
                  width: 100%;
                  text-align: center;
                  font-size: 14px;
              }
              .location {
                  font-style: italic;
                  margin-top: 5px;
              }
              .badge-type {
                  position: absolute;
                  top: 10px;
                  right: 10px;
                  background-color: #e91e63;
                  color: white;
                  padding: 5px 10px;
                  border-radius: 10px;
                  font-size: 14px;
                  font-weight: bold;
              }
              .back-content {
                  padding: 30px;
                  text-align: left;
              }
              .back-header {
                  font-size: 20px;
                  font-weight: bold;
                  color: #4a90e2;
                  margin-bottom: 20px;
              }
              .disclaimer {
                  font-size: 12px;
                  color: #666;
                  margin-top: 20px;
              }
              .contact-info {
                  margin-top: 20px;
                  font-size: 14px;
                  color: #333;
              }
          </style>
      </head>
      <body>
          <!-- Front side of the badge -->
          <div class="badge" id="badge-front">
              <div class="header">
                  <div class="logo">
                      <span class="id">ID</span><span class="tai">TAI</span>
                      <span class="year">2024</span>
                  </div>
                  Innovation and Digital Transformation
              </div>
              <div class="badge-type">ATTENDEE</div>
              <div class="content">
                  <div class="name">${visitorData.name}</div>
                  <div class="organization">${visitorData.organization}</div>
                  <div class="barcode">
                      <img src="${barcodeDataUrl}" alt="barcode" />
                  </div>
              </div>
              <div class="footer">
                  <div>November 27-29, 2024</div>
                  <div class="location">Valencia, Spain</div>
              </div>
          </div>

          <!-- Back side of the badge -->
          <div class="badge" id="badge-back">
              <div class="back-content">
                  <div class="back-header">IDTAI 2024 Attendee Badge</div>
                  <div class="barcode">
                    <img src="${barcodeDataUrl}" alt="barcode" />
                  </div>
                  <div class="disclaimer">
                     This badge is non-transferable and must be worn visibly at all times during the conference. A lanyard and badge holder will be provided at the entrance. Please insert this badge into the holder upon arrival. Lost badges should be reported immediately to the registration desk. Replacement fees may apply.
                  </div>
                  <div class="contact-info">
                      <strong>Contact:</strong><br>
                      enquiries@idtaievents.com<br>
                      Palacio de Congresos de Valencia<br>
                      Av. de les Corts Valencianes, 60<br>
                      46015 Valencia, Spain
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;

    // Launch Puppeteer to generate PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(badgeHTML, { waitUntil: "networkidle0" });

    // Generate a two-page PDF (front and back)
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    return pdfBuffer;
  } catch (error) {
    console.error("Error generating badge PDF:", error);
    throw new Error("Failed to generate badge PDF.");
  }
}

// Function to send the registration confirmation email
async function sendRegistrationConfirmationEmail({
  FullName,
  Email,
  Organisation,
  Country,
  EventName,
  RegistrationCode,
  badgePDF,
}) {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Registration Confirmation - IDTAI 2024</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #444444;
          }
          .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #ffffff;
            padding: 20px;
            text-align: center;
            border-bottom: 4px solid #ff4d6d;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #444444;
          }
          .header h1 span.text-primary {
            color: #1d4ed8;
          }
          .header h1 span.text-pink-500 {
            color: #ff4d6d;
          }
          .header h1 span.text-sm {
            font-size: 16px;
            color: #666666;
          }
          .content {
            padding: 20px;
          }
          .content h2 {
            font-size: 20px;
            color: #444444;
          }
          .content p {
            font-size: 16px;
            color: #666666;
            line-height: 1.6;
          }
          .footer {
            background-color: #1f2937;
            color: #ffffff;
            padding: 20px;
            text-align: center;
          }
          .footer p {
            margin: 5px 0;
            font-size: 14px;
          }
          .footer a {
            color: #ffffff;
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>
              <span class="text-primary">ID</span>
              <span class="text-pink-500">TAI</span>
              <span class="text-sm">2024</span>
            </h1>
          </div>
          <div class="content">
            <h2>Congratulations, ${FullName}!</h2>
            <p>We are excited to confirm your registration for <strong>${EventName}</strong>, and we have successfully received your payment.</p>
            <p>Your visitor badge is attached to this email. This badge is required for entry to the conference, so please ensure you have it with you on the day of the event.</p>
            <p><strong>Registration Details:</strong></p>
            <p><strong>Full Name:</strong> ${FullName}<br />
              <strong>Email:</strong> ${Email}<br />
              <strong>Organisation:</strong> ${Organisation}<br />
              <strong>Country:</strong> ${Country}<br />
              <strong>Registration Code:</strong> ${RegistrationCode}<br />
            </p>
            <p><strong>Conference Date & Venue:</strong></p>
            <p>
              <strong>Date:</strong> November 27-29, 2024<br />
              <strong>Venue:</strong> Palacio de Congresos de Valencia, Av. de les Corts Valencianes, 60, 46015 Valencia, Spain
            </p>
            <p>We look forward to seeing you at the conference!</p>
          </div>
          <div class="footer">
            <p>If you have any questions or need further assistance, feel free to contact us:</p>
            <p>Email: <a href="mailto:enquiries@idtaievents.com">enquiries@idtaievents.com</a></p>
            <p>Location: Palacio de Congresos de Valencia</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Attach the PDF directly as a base64 encoded file
    await client.sendMail({
      from: {
        address: "noreply@idtaievents.com",
        name: "IDTAI 2024",
      },
      to: [
        {
          email_address: {
            address: Email,
            name: FullName,
          },
        },
      ],
      subject: "Registration Confirmation - IDTAI 2024",
      htmlbody: emailHtml,
      attachments: [
        {
          content: Buffer.from(badgePDF).toString("base64"),
          mime_type: "application/pdf",
          name: "IDTAI_2024_badge.pdf",
        },
      ],
    });

    console.log("Email sent successfully to:", Email);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send registration confirmation email.");
  }
}
