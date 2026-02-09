export function generateEmailHTML(bodyContent: string): string {
    const currentYear = new Date().getFullYear();
    // Using a public URL for the logo, assuming it's hosted where the app is. 
    // For local dev, this might need adjustment or be a hosted image.
    // Ideally, replace with a CDN link in production.
    const logoUrl = 'https://decksage.com.br/decksage.png'; // Fallback or production URL

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background-color: #1a1a1a; padding: 20px; text-align: center; }
            .header img { max-height: 50px; }
            .content { padding: 30px 20px; line-height: 1.6; }
            .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #ddd; }
            .footer a { color: #888; text-decoration: underline; }
            h1, h2, h3 { color: #1a1a1a; }
            .button { display: inline-block; padding: 10px 20px; background-color: #d97706; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${logoUrl}" alt="DeckSage Logo">
            </div>
            <div class="content">
                ${bodyContent}
            </div>
            <div class="footer">
                <p>&copy; ${currentYear} DeckSage via MTG Brasil. Todos os direitos reservados.</p>
                <p>Você está recebendo este e-mail porque se cadastrou em nossa plataforma.</p>
                <p><a href="{{unsubscribe_url}}">Descadastrar</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
}
