interface NewsletterFullProps {
  html: string;
}

export default function NewsletterFull({ html }: NewsletterFullProps) {
  return (
    <div
      className="prose prose-invert prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
