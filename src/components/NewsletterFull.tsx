interface NewsletterFullProps {
  html: string;
}

export default function NewsletterFull({ html }: NewsletterFullProps) {
  return (
    <div
      className="max-w-none"
      style={{ background: "#f9fafb", borderRadius: "20px", padding: "24px", color: "#111827" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const styles = `
  blockquote {
    border-left: 4px solid #10b981;
    margin: 20px 0;
    padding: 12px 20px;
    background: #f0fdf4;
    border-radius: 0 8px 8px 0;
    font-style: italic;
    font-size: 17px;
    color: #374151;
    line-height: 1.6;
  }
`;

if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}
