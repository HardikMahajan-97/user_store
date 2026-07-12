import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw error;
  }
};

export const sendJobNotificationEmail = async (studentEmail, studentName, job, company) => {
  const html = `
    <h2>New Job Opportunity!</h2>
    <p>Hi ${studentName},</p>
    <p>A new job opportunity has been posted by <strong>${company.name}</strong>:</p>
    <ul>
      <li><strong>Position:</strong> ${job.jobRole}</li>
      <li><strong>Stipend:</strong> ₹${job.stipend}</li>
      <li><strong>Post PPO CTC:</strong> ${job.postPpoCTC ? `₹${job.postPpoCTC}` : "N/A"}</li>
    </ul>
    <p>${job.jobDescription}</p>
    <p><a href="${process.env.FRONTEND_URL}/jobs/${job._id}">View Details & Apply</a></p>
  `;

  return sendEmail(studentEmail, `New Job: ${job.jobRole} at ${company.name}`, html);
};

export const sendApplicationConfirmationEmail = async (
  studentEmail,
  studentName,
  job,
  company
) => {
  const html = `
    <h2>Application Received</h2>
    <p>Hi ${studentName},</p>
    <p>Your application for <strong>${job.jobRole}</strong> at <strong>${company.name}</strong> has been received successfully.</p>
    <p>We will review your profile and notify you about the next steps.</p>
    <p>Good luck!</p>
  `;

  return sendEmail(
    studentEmail,
    `Application Confirmed: ${job.jobRole} at ${company.name}`,
    html
  );
};

export const sendShortlistEmail = async (studentEmail, studentName, job, company) => {
  const html = `
    <h2>Congratulations! You're Shortlisted</h2>
    <p>Hi ${studentName},</p>
    <p>Great news! You have been shortlisted for the position of <strong>${job.jobRole}</strong> at <strong>${company.name}</strong>.</p>
    <p>The company will contact you soon with next steps.</p>
    <p>Contact: ${company.email}</p>
  `;

  return sendEmail(studentEmail, `Shortlisted: ${job.jobRole} at ${company.name}`, html);
};

export const sendSelectionEmail = async (studentEmail, studentName, job, company) => {
  const html = `
    <h2>Great News! You're Selected</h2>
    <p>Hi ${studentName},</p>
    <p>You have been selected for <strong>${job.jobRole}</strong> at <strong>${company.name}</strong>.</p>
    <p>The placement team will share the next steps shortly.</p>
  `;

  return sendEmail(studentEmail, `Selected: ${job.jobRole} at ${company.name}`, html);
};

export const sendRejectionEmail = async (studentEmail, studentName, job, company, reasons) => {
  const html = `
    <h2>Application Status Update</h2>
    <p>Hi ${studentName},</p>
    <p>Thank you for applying for the position of <strong>${job.jobRole}</strong> at <strong>${company.name}</strong>.</p>
    <p>Unfortunately, you did not meet the following criteria:</p>
    <ul>
      ${reasons.map((reason) => `<li>${reason}</li>`).join("")}
    </ul>
    <p>We encourage you to apply for other opportunities in the future.</p>
  `;

  return sendEmail(studentEmail, `Application Update: ${job.jobRole} at ${company.name}`, html);
};

export const sendShortlistingCompleteEmail = async (adminEmail, adminName, job, company, totalShortlisted) => {
  const html = `
    <h2>Shortlisting Completed</h2>
    <p>Hi ${adminName},</p>
    <p>Shortlisting for <strong>${job.jobRole}</strong> at <strong>${company.name}</strong> has been completed.</p>
    <p><strong>Total Shortlisted Students:</strong> ${totalShortlisted}</p>
    <p>Please review the list and forward it to the company.</p>
  `;

  return sendEmail(adminEmail, `Shortlisting Complete: ${job.jobRole} at ${company.name}`, html);
};
