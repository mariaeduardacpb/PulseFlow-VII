const generateOTP = () => {
    // Gera um código OTP de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Define a expiração do OTP para 10 minutos à frente
    const expires = new Date(Date.now() + 10 * 60000);

    return { code, expires };
};

export default { generateOTP };
