'use client';

import { generateEmailHTML } from '@/lib/email-template'; // We need a client-safe version or just replicate logic
import { useEffect, useRef } from 'react';

interface EmailPreviewProps {
  content: string;
}

// Replicating basic structure for client-side preview without importing server-only code if needed
// Or ensuring generateEmailHTML is shared/safe.
// Assuming it is safe as it just returns a string.

export default function EmailPreview({ content }: EmailPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      // We use the helper function but mocked because we are on client.
      // Actually, let's just inline a simple preview wrapper or fetch the real template if possible.
      // Ideally, we import verify standard template structure.

      // Simplified Client Preview Template matching the server one.
      const currentYear = new Date().getFullYear();
      const logoUrl = '/decksage.png'; // Local path for preview

      const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <style>
                    body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; color: #333; }
                    .container { max-width: 100%; margin: 0 auto; background-color: #ffffff; }
                    .header { background-color: #1a1a1a; padding: 20px; text-align: center; }
                    .header img { max-height: 50px; }
                    .content { padding: 30px 20px; line-height: 1.6; }
                    .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #ddd; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="${logoUrl}" alt="DeckSage Logo">
                    </div>
                    <div class="content">
                        ${content || '<p style="color:#ccc; text-align:center;">Comece a digitar para ver o resultado...</p>'}
                    </div>
                    <div class="footer">
                        <p>&copy; ${currentYear} DeckSage via MTG Brasil.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [content]);

  return (
    <div className="border border-neutral-700 rounded-lg overflow-hidden bg-white h-[500px]">
      <iframe ref={iframeRef} title="Email Preview" className="w-full h-full border-0" />
    </div>
  );
}
