import { useEffect, useState } from 'react';
import { 
  Plus, MoreVertical, Check, Server, Pencil, 
  Trash2, RefreshCw, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { useProvidersStore, Provider } from '@/store/providersStore';
import ProviderDialog from './ProviderDialog';
import { toast } from 'sonner';

export default function ProvidersManager() {
  const { providers, fetchProviders, deleteProvider, updateProvider, testConnection, isLoading } = useProvidersStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleAdd = () => {
    setEditingProvider(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider);
    setIsDialogOpen(true);
  };

  const handleDelete = async (provider: Provider) => {
    if (provider.isDefault) {
      toast.error("Cannot delete default provider. Please set another provider as default first.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${provider.name}?`)) {
      const success = await deleteProvider(provider.id);
      if (success) {
        toast.success("Provider deleted successfully");
      }
    }
  };

  const handleSetDefault = async (provider: Provider) => {
    const success = await updateProvider(provider.id, { isDefault: true });
    if (success) {
      toast.success(`${provider.name} is now the default provider`);
    }
  };

  const handleTestConnection = async (provider: Provider) => {
    setTestingId(provider.id);
    const result = await testConnection(provider.id);
    setTestingId(null);
    
    if (result.success) {
      toast.success(result.message || "Connection Successful");
    } else {
      toast.error(result.message || "Connection Failed");
    }
  };

  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'Connected':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Connected</Badge>;
      case 'Disconnected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 border-none"><ShieldAlert className="w-3 h-3 mr-1" /> Disconnected</Badge>;
      default:
        return <Badge variant="secondary" className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-none">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Model Providers</h2>
          <p className="text-sm text-slate-500">Manage LLM APIs and local inference engines.</p>
        </div>
        <Button onClick={handleAdd} className="bg-[#2563EB] hover:bg-[#1D4ED8] shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Provider
        </Button>
      </div>

      {isLoading && providers.length === 0 ? (
        <div className="flex justify-center p-12"><RefreshCw className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : providers.length === 0 ? (
        <Card className="border-dashed shadow-none bg-slate-50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Server className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No Providers Configured</h3>
            <p className="text-sm text-slate-500 mb-4">Connect to OpenAI, Gemini, Ollama, or custom APIs to get started.</p>
            <Button variant="outline" onClick={handleAdd}>Add First Provider</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <Card key={provider.id} className={`flex flex-col relative overflow-hidden transition-all duration-200 hover:shadow-md border-[#E5E7EB] ${provider.isDefault ? 'ring-1 ring-[#2563EB] shadow-sm' : ''}`}>
              {provider.isDefault && (
                <div className="absolute top-0 right-0 left-0 h-1 bg-[#2563EB]" />
              )}
              
              <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0 relative">
                <div className="pr-8">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-base font-semibold text-slate-900 truncate">
                      {provider.name}
                    </CardTitle>
                    {provider.isDefault && (
                      <Badge variant="default" className="bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 border-none px-1.5 py-0">Default</Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs font-medium text-slate-500">
                    {provider.type}
                  </CardDescription>
                </div>
                
                <div className="absolute top-4 right-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {!provider.isDefault && (
                        <DropdownMenuItem onSelect={(e) => {
                          e.preventDefault();
                          handleSetDefault(provider);
                        }}>
                          <Check className="mr-2 h-4 w-4" /> Set as Default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={(e) => {
                        e.preventDefault();
                        handleEdit(provider);
                      }}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit Configuration
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={(e) => {
                        e.preventDefault();
                        handleDelete(provider);
                      }} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Provider
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col justify-between pt-0">
                <div className="space-y-4 mb-4">
                  <div className="text-sm truncate text-slate-500">
                    {provider.baseUrl || <span className="italic text-slate-400">Default URL</span>}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Chat Model</span>
                      <span className="font-medium text-slate-700 truncate max-w-[120px]" title={provider.chatModel}>
                        {provider.chatModel || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  {renderStatusBadge(provider.connectionStatus)}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    onClick={() => handleTestConnection(provider)}
                    disabled={testingId === provider.id}
                  >
                    {testingId === provider.id ? <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1.5" />}
                    Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isDialogOpen && (
        <ProviderDialog 
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          provider={editingProvider}
        />
      )}
    </div>
  );
}
