import { Resend } from 'resend';

const getResendClient = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  try {
    return new Resend(apiKey);
  } catch (err) {
    console.error('[EmailService] Erro ao inicializar SDK Resend:', err);
    return null;
  }
};

const FROM_EMAIL = process.env.EMAIL_FROM || 'Tarefa & Mesada <noreply@tarefamesada.app>';

export const sendPasswordResetEmail = async (to: string, name: string, code: string): Promise<void> => {
  const resend = getResendClient();

  if (!resend) {
    console.warn(`[EmailService] ⚠️ RESEND_API_KEY não configurada! Código de recuperação para ${to} (${name}): [ ${code} ]`);
    // Em dev/teste sem chave Resend, registra no console sem quebrar a aplicação
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: '🔑 Código de recuperação de senha — Tarefa & Mesada',
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Recuperação de Senha</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
          <tr>
            <td align="center">
              <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#38C6C9,#2FA8B0);padding:32px;text-align:center;">
                    <p style="margin:0;font-size:40px;">✅</p>
                    <h1 style="margin:12px 0 0;color:#ffffff;font-size:22px;font-weight:700;">Tarefa &amp; Mesada</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 8px;font-size:16px;color:#333333;">Olá, <strong>${name}</strong>!</p>
                    <p style="margin:0 0 24px;font-size:15px;color:#555555;line-height:1.6;">
                      Recebemos uma solicitação para redefinir a senha da sua conta.<br/>
                      Use o código abaixo para criar uma nova senha:
                    </p>
                    <!-- Code box -->
                    <div style="background:#f0fafa;border:2px solid #38C6C9;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                      <p style="margin:0 0 8px;font-size:13px;color:#38C6C9;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Código de verificação</p>
                      <p style="margin:0;font-size:42px;font-weight:800;color:#2c3e50;letter-spacing:10px;font-family:'Courier New',monospace;">${code}</p>
                    </div>
                    <p style="margin:0 0 24px;font-size:14px;color:#888888;text-align:center;">
                      ⏰ Este código expira em <strong>15 minutos</strong>.
                    </p>
                    <hr style="border:none;border-top:1px solid #eeeeee;margin:0 0 20px;"/>
                    <p style="margin:0;font-size:13px;color:#aaaaaa;text-align:center;">
                      Se você não solicitou a redefinição, pode ignorar este e-mail.<br/>
                      Sua senha permanece a mesma.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding:16px 32px;background:#f9f9f9;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#cccccc;">© 2026 Tarefa &amp; Mesada</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });

  if (error) {
    console.error('[EmailService] Failed to send reset email:', error);
    throw new Error('Falha ao enviar e-mail de recuperação.');
  }
};

