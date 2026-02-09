import { Block } from "@blocknote/core";


function renderInline(content: any): string {
    if (!content) return "";
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
        return content.map(renderInline).join("");
    }

    // Handle Link
    if (content.type === "link") {
        const href = content.href || "#";
        const innerText = renderInline(content.content);
        return `<a href="${href}" style="color: #d97706; text-decoration: underline;">${innerText}</a>`;
    }

    // Handle Styled Text
    if (content.text) {
        let text = content.text;
        if (content.styles) {
            if (content.styles.bold) text = `<strong>${text}</strong>`;
            if (content.styles.italic) text = `<em>${text}</em>`;
            if (content.styles.underline) text = `<u>${text}</u>`;
            if (content.styles.strike) text = `<s>${text}</s>`;
            // Add other styles as needed
        }
        return text;
    }

    return "";
}

export async function blocksToHTML(blocks: Block[]): Promise<string> {
    let html = "";

    for (const block of blocks) {
        // Safe access to content
        const content = block.content as any[];

        switch (block.type) {
            case "paragraph":
                html += `<p style="margin: 0 0 1em 0;">${renderInline(content)}</p>`;
                break;
            case "heading":
                const level = block.props.level || 2;
                html += `<h${level} style="color: #ffffff; margin-top: 20px; margin-bottom: 10px;">${renderInline(content)}</h${level}>`;
                break;
            case "bulletListItem":
                html += `<ul><li style="margin-bottom: 5px;">${renderInline(content)}</li></ul>`;
                break;
            case "numberedListItem":
                html += `<ol><li style="margin-bottom: 5px;">${renderInline(content)}</li></ol>`;
                break;
            case "image":
                const url = block.props.url;
                if (url) {
                    html += `<img src="${url}" alt="Image" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px;" />`;
                }
                break;
            default:
                if (content) {
                    html += `<p>${renderInline(content)}</p>`;
                }
                break;
        }
    }

    // Clean up adjacent lists (merging </ul><ul>)
    html = html.replace(/<\/ul><ul>/g, '');
    html = html.replace(/<\/ol><ol>/g, '');

    return html;
}
