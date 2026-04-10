export function exportPrintableDocument(title: string, bodyHtml: string) {
  const popup = window.open("", "_blank", "noopener,noreferrer,width=1024,height=768")
  if (!popup) {
    throw new Error("Popup blocked by browser. Allow popups and try again.")
  }

  popup.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #111; }
          h1 { margin: 0 0 8px; font-size: 24px; }
          h2 { margin: 24px 0 8px; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 13px; }
          .muted { color: #6b7280; font-size: 13px; }
          .kpi { margin: 0 0 6px; font-size: 14px; }
        </style>
      </head>
      <body>
        ${bodyHtml}
      </body>
    </html>
  `)
  popup.document.close()
  popup.focus()
  popup.print()
}
