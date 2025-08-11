import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Mail, ExternalLink } from 'lucide-react';
import { MicrositeContent, MicrositeCard } from '@/hooks/useMicrositeContent';

interface PublicMicrositeViewProps {
  content: MicrositeContent | null;
  cards: MicrositeCard[];
  title: string;
}

export const PublicMicrositeView: React.FC<PublicMicrositeViewProps> = React.memo(({
  content,
  cards,
  title,
}) => {
  const getButtonIcon = (actionType: string) => {
    switch (actionType) {
      case 'tel':
        return <Phone className="h-5 w-5" />;
      case 'mailto':
        return <Mail className="h-5 w-5" />;
      case 'url':
      default:
        return <ExternalLink className="h-5 w-5" />;
    }
  };

  const handleButtonClick = (actionType: string, actionValue: string) => {
    switch (actionType) {
      case 'tel':
        window.open(`tel:${actionValue}`, '_self');
        break;
      case 'mailto':
        window.open(`mailto:${actionValue}`, '_self');
        break;
      case 'url':
        window.open(actionValue, '_blank', 'noopener,noreferrer');
        break;
    }
  };

  const formatContent = (content: string | null) => {
    if (!content) return null;
    
    // Enhanced text formatting with bold, italic, underline support
    const formattedText = content
      // Bold: **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic: *text* or _text_
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
      .replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')
      // Underline: <u>text</u>
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
      // Line breaks
      .replace(/\n/g, '<br>');

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: formattedText }}
        className="text-base leading-relaxed"
      />
    );
  };

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Microsite Not Found</h1>
          <p className="text-muted-foreground">
            This microsite doesn't exist or is not published.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full flex justify-center"
      style={{
        backgroundColor: content.theme_config.background,
        color: content.theme_config.text,
      }}
    >
      <div className="w-full max-w-md">
        {/* Header Image */}
        {content.header_image_url && (
          <div className="w-full flex items-center justify-center py-8 px-4">
            <img
              src={content.header_image_url}
              alt="Header"
              className="object-contain max-w-full"
              style={{ maxHeight: '200px' }}
            />
          </div>
        )}

        {/* Content */}
        <div className="px-4 pb-8 space-y-8">
          {/* Title */}
          {title && (
            <h1 
              className="text-3xl font-bold text-center px-4" 
              style={{ color: content.theme_config.text }}
            >
              {title}
            </h1>
          )}

          {/* Cards */}
          <div className="space-y-6">
            {cards.map((card) => (
              <div 
                key={card.id} 
                className="bg-white/5 backdrop-blur-sm rounded-lg p-6 space-y-4"
                style={{
                  backgroundColor: content.theme_config.background === '#ffffff' 
                    ? '#f8f9fa' 
                    : 'rgba(255, 255, 255, 0.05)',
                }}
              >
                {/* Card Title */}
                {card.title && (
                  <h2 
                    className="text-xl font-semibold"
                    style={{ color: content.theme_config.text }}
                  >
                    {card.title}
                  </h2>
                )}

                {/* Card Content */}
                {card.content && (
                  <div style={{ color: content.theme_config.text }}>
                    {formatContent(card.content)}
                  </div>
                )}

                {/* Card Media */}
                {card.media_url && (
                  <div className="w-full">
                    <img
                      src={card.media_url}
                      alt="Card media"
                      className="w-full rounded-lg object-cover max-h-80"
                    />
                  </div>
                )}

                {/* Card Buttons */}
                {card.buttons.length > 0 && (
                  <div className="space-y-3 pt-2">
                    {card.buttons
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((button) => (
                      <Button
                          key={button.id}
                          variant="ghost"
                          size="lg"
                          className="w-full justify-start text-left py-4 px-6 rounded-lg"
                          style={{
                            backgroundColor: content.theme_config.primary,
                            color: '#ffffff',
                            minHeight: '56px',
                          }}
                          onClick={() => handleButtonClick(button.action_type, button.action_value)}
                        >
                          {getButtonIcon(button.action_type)}
                          <span className="ml-3 text-base font-medium">{button.label}</span>
                        </Button>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {cards.length === 0 && (
            <div className="text-center py-12 text-opacity-70">
              <p className="text-lg">No content available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});