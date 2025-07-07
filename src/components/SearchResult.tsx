import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ExternalLink, Calendar, Clock, Star, Globe } from "lucide-react";

interface SearchResultProps {
  title: string;
  url: string;
  content?: string;
  source: string;
  score?: number;
  image?: string;
  search_query?: string;
  // Keep legacy props for backward compatibility
  snippet?: string;
  summary?: string;
  image_url?: string;
  relevance_score?: number;
  category?: string;
  result_type?: string;
  published_date?: string;
  reading_time?: string;
}

export function SearchResult({
  title,
  url,
  content,
  source,
  score,
  image,
  // Legacy props
  snippet,
  summary,
  image_url,
  relevance_score,
  category,
  result_type,
  published_date,
  reading_time,
}: SearchResultProps) {
  // Use the new field names first, then fall back to legacy ones
  const displayText = content || summary || snippet || "";
  const displayScore = score ?? relevance_score;
  const displayImage = image || image_url;
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-0">
        <div className="flex gap-4 p-6">
          {/* Thumbnail Image */}
          {displayImage && (
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden">
                <img 
                  src={displayImage} 
                  alt={title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.parentElement!.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header with title and score */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground leading-tight hover:text-primary transition-colors line-clamp-2">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <Globe className="h-3 w-3" />
                  <span className="font-medium">{source}</span>
                  {result_type && (
                    <>
                      <span>•</span>
                      <span>{result_type}</span>
                    </>
                  )}
                </p>
              </div>
              
              {/* Relevance Score - only show if available */}
              {displayScore !== undefined && (
                <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-medium">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{displayScore.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            {/* Summary/Snippet */}
            {displayText && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {displayText}
              </p>
            )}
            
            {/* Metadata and Actions */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {published_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{published_date}</span>
                  </div>
                )}
                {reading_time && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{reading_time}</span>
                  </div>
                )}
                {category && (
                  <Badge variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                )}
              </div>
              
              {/* Visit Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-4 hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => window.open(url, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Visit
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
