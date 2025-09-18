import DOMPurify from 'isomorphic-dompurify';

interface SafeHTMLProps {
  html: string;
}

const SafeHTML: React.FC<SafeHTMLProps> = ({ html }) => {
  // Sanitasi HTML dengan konfigurasi khusus
  const sanitizedHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'a', 'ul', 'li', 'img'],
    ALLOWED_ATTR: ['href', 'src', 'alt'],
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />;
};

export default SafeHTML;