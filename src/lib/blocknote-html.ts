import { Block } from "@blocknote/core";

export async function blocksToHTML(blocks: Block[]): Promise<string> {
    let html = "";

    for (const block of blocks) {
        switch (block.type) {
            case "paragraph":
                html += `<p style="margin: 0 0 1em 0;">${(block.content as any[])?.map(c => c.text || c).join('') || ''}</p>`;
                break;
            case "heading":
                // Defaulting to h2 for simplicity in email, or map level if available
                const level = block.props.level || 2;
                html += `<h${level} style="color: #1a1a1a; margin-top: 20px; margin-bottom: 10px;">${(block.content as any[])?.map(c => c.text || c).join('') || ''}</h${level}>`;
                break;
            case "bulletListItem":
                html += `<ul><li style="margin-bottom: 5px;">${(block.content as any[])?.map(c => c.text || c).join('') || ''}</li></ul>`;
                break;
            case "numberedListItem":
                html += `<ol><li style="margin-bottom: 5px;">${(block.content as any[])?.map(c => c.text || c).join('') || ''}</li></ol>`;
                break;
            case "image":
                // Assuming url is in props
                const url = block.props.url;
                if (url) {
                    html += `<img src="${url}" alt="Image" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
                }
                break;
            // Add more cases as needed (checklists, etc are harder in email)
            default:
                // Fallback for unknown blocks
                if (block.content) {
                    html += `<p>${(block.content as any[])?.map(c => c.text || c).join('') || ''}</p>`;
                }
                break;
        }
    }

    // Clean up adjacent lists if needed (simple approach above creates ul/ol per item which is valid but not semantic optimization)
    // For emails, strict semantic HTML isn't as critical as visual rendering. 
    // Optimization: Regex to merge adjacent </ul><ul> could be done but might be overkill for v1.
    html = html.replace(/<\/ul><ul>/g, '');
    html = html.replace(/<\/ol><ol>/g, '');

    return html;
}
