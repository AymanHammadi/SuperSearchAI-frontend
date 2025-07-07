import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Settings, Eye, EyeOff, Trash2, Save, Key } from 'lucide-react';
import { type LLMProvider, providerLabels, getApiKey, setApiKey, deleteApiKey } from '../lib/apiKeys';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKeys, setApiKeys] = useState<Record<LLMProvider, string>>({} as Record<LLMProvider, string>);
  const [showKeys, setShowKeys] = useState<Record<LLMProvider, boolean>>({} as Record<LLMProvider, boolean>);
  const [hasChanges, setHasChanges] = useState(false);

  // Memoize providers to prevent recreation on every render
  const providers = useMemo(() => Object.keys(providerLabels) as LLMProvider[], []);

  useEffect(() => {
    if (isOpen) {
      // Load current API keys when modal opens
      const loadedKeys = {} as Record<LLMProvider, string>;
      const initialShowKeys = {} as Record<LLMProvider, boolean>;
      
      providers.forEach(provider => {
        loadedKeys[provider] = getApiKey(provider) || '';
        initialShowKeys[provider] = false;
      });
      
      setApiKeys(loadedKeys);
      setShowKeys(initialShowKeys);
      setHasChanges(false);
    }
  }, [isOpen, providers]);

  const handleKeyChange = (provider: LLMProvider, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    setHasChanges(true);
  };

  const toggleShowKey = (provider: LLMProvider) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleDeleteKey = (provider: LLMProvider) => {
    setApiKeys(prev => ({ ...prev, [provider]: '' }));
    setHasChanges(true);
  };

  const saveKeys = () => {
    providers.forEach(provider => {
      const key = apiKeys[provider];
      if (key && key.trim()) {
        setApiKey(provider, key.trim());
      } else {
        deleteApiKey(provider);
      }
    });
    setHasChanges(false);
    onClose();
  };

  const cancelChanges = () => {
    setHasChanges(false);
    onClose();
  };

  const getKeyStatus = (provider: LLMProvider) => {
    const originalKey = getApiKey(provider);
    const currentKey = apiKeys[provider];
    
    if (originalKey && currentKey) {
      return 'configured';
    } else if (currentKey && !originalKey) {
      return 'new';
    } else if (!currentKey && originalKey) {
      return 'deleted';
    }
    return 'none';
  };

  const getStatusBadge = (provider: LLMProvider) => {
    const status = getKeyStatus(provider);
    switch (status) {
      case 'configured':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Configured</Badge>;
      case 'new':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">New</Badge>;
      case 'deleted':
        return <Badge variant="destructive">Deleted</Badge>;
      default:
        return <Badge variant="outline">Not Set</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API Key Settings
          </DialogTitle>
          <DialogDescription>
            Manage your API keys for different LLM providers. Keys are stored locally and securely in your browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {providers.map(provider => (
            <Card key={provider} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    {providerLabels[provider]}
                  </div>
                  {getStatusBadge(provider)}
                </CardTitle>
                <CardDescription className="text-sm">
                  API key for {providerLabels[provider]} service
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor={`key-${provider}`} className="text-sm font-medium">
                        API Key
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id={`key-${provider}`}
                          type={showKeys[provider] ? "text" : "password"}
                          placeholder="Enter your API key..."
                          value={apiKeys[provider] || ''}
                          onChange={(e) => handleKeyChange(provider, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleShowKey(provider)}
                          title={showKeys[provider] ? "Hide key" : "Show key"}
                        >
                          {showKeys[provider] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteKey(provider)}
                          disabled={!apiKeys[provider]}
                          title="Delete key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t">
          <div className="text-sm text-muted-foreground self-center">
            {hasChanges && "You have unsaved changes"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelChanges}>
              Cancel
            </Button>
            <Button onClick={saveKeys} disabled={!hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
