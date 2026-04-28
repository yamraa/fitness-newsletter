interface NewsletterTeaserProps {
  html: string;
}

export default function NewsletterTeaser({ html }: NewsletterTeaserProps) {
  return (
    <div className="relative">
      <div
        className="max-h-[500px] overflow-hidden"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-gray-900 to-transparent" />
    </div>
  );
}
