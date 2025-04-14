import twilio from 'twilio';

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendSMS = async (to, code) => {
  await client.messages.create({
    body: `Seu código de verificação PulseFlow é: ${code}`,
    from: process.env.TWILIO_PHONE,
    to: to
  });
};
