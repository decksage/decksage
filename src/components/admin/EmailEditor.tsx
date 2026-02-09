'use client';

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteViewRaw } from "@blocknote/react";
import "@blocknote/react/style.css";
import { blocksToHTML } from "@/lib/blocknote-html";
import { useEffect, useState } from "react";

interface EmailEditorProps {
    initialValue?: string; // HTML string
    initialBlocks?: string; // JSON string of blocks
    onChange: (htmlContent: string, blocksJson: string) => void;
}

export default function EmailEditor({ initialValue, initialBlocks, onChange }: EmailEditorProps) {
    const editor = useCreateBlockNote({
        initialContent: initialBlocks ? JSON.parse(initialBlocks) : undefined,
    });

    useEffect(() => {
        async function loadInitialHTML() {
            if (!initialBlocks && initialValue && editor) {
                const blocks = await editor.tryParseHTMLToBlocks(initialValue);
                editor.replaceBlocks(editor.document, blocks);
            }
        }
        loadInitialHTML();
    }, [editor, initialBlocks, initialValue]);

    // Internal state to debounce or manage updates if needed
    // const [html, setHtml] = useState(initialValue || "");

    const handleChange = async () => {
        // Get blocks
        const blocks = editor.document;
        // Convert to HTML
        const htmlOutput = await blocksToHTML(blocks);
        // setHtml(htmlOutput);
        onChange(htmlOutput, JSON.stringify(blocks));
    };

    return (
        <div className="border border-neutral-700 rounded-lg overflow-hidden bg-neutral-900 min-h-[300px]">
            <BlockNoteViewRaw
                editor={editor}
                onChange={handleChange}
                theme="dark"
                sideMenu={false}
                formattingToolbar={false}
                className="min-h-[300px]"
            />
        </div>
    );
}
