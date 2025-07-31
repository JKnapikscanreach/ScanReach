import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Mail, ExternalLink } from 'lucide-react';
import { MicrositeContent, MicrositeCard } from '@/hooks/useMicrositeContent';

interface MicrositePreviewProps {
  content: MicrositeContent;
  cards: MicrositeCard[];
  title: string;
}

export const MicrositePreview: React.FC<MicrositePreviewProps> = ({
  content,
  cards,
  title,
}) => {
  const getButtonIcon = (actionType: string) => {
    switch (actionType) {
      case 'tel':
        return <Phone className="h-4 w-4" />;
      case 'mailto':
        return <Mail className="h-4 w-4" />;
      case 'url':
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
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
    
    // Simple text formatting - convert line breaks to paragraphs
    const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
    
    return paragraphs.map((paragraph, index) => (
      <p key={index} className="mb-2 last:mb-0">
        {paragraph}
      </p>
    ));
  };

  return (
    <div 
      className="max-w-sm mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
      style={{
        backgroundColor: content.theme_config.background,
        color: content.theme_config.text,
      }}
    >
      {/* Header Image */}
      {content.header_image_url && (
        <div className="aspect-[3/1] bg-gray-100 overflow-hidden">
          <img
            src={content.header_image_url}
            alt="Header"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Title */}
        {title && (
          <h1 className="text-2xl font-bold text-center" style={{ color: content.theme_config.text }}>
            {title}
          </h1>
        )}

        {/* Cards */}
        {cards.map((card) => (
          <Card 
            key={card.id} 
            className="border shadow-sm"
            style={{
              backgroundColor: content.theme_config.background,
              borderColor: content.theme_config.text + '20', // 20% opacity
            }}
          >
            <CardContent className="p-4 space-y-4">
              {/* Card Content */}
              {card.content && (
                <div className="text-sm leading-relaxed" style={{ color: content.theme_config.text }}>
                  {formatContent(card.content)}
                </div>
              )}

              {/* Card Media */}
              {card.media_url && (
                <div className="w-full">
                  <img
                    src={card.media_url}
                    alt="Card media"
                    className="w-full rounded-md object-cover"
                  />
                </div>
              )}

              {/* Card Buttons */}
              {card.buttons.length > 0 && (
                <div className="space-y-2">
                  {card.buttons.map((button) => (
                    <Button
                      key={button.id}
                      variant="default"
                      className="w-full justify-start border-0"
                      style={{
                        backgroundColor: `${content.theme_config.primary} !important`,
                        color: '#ffffff',
                      }}
                      onClick={() => handleButtonClick(button.action_type, button.action_value)}
                    >
                      {getButtonIcon(button.action_type)}
                      <span className="ml-2">{button.label}</span>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {cards.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No content cards yet</p>
            <p className="text-sm">Add cards in the editor to see them here</p>
          </div>
        )}
      </div>
    </div>
  );
};