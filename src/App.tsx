import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { ValidateForm } from './components/ValidateForm';
import { ModelPicker } from './components/ModelPicker';
import { SavedVault } from './components/SavedVault';
import { ExchangeInspector } from './components/ExchangeInspector';
import { CustomRequestSender } from './components/CustomRequestSender';
import { ToolsTab } from './components/ToolsTab';
import { CustomProviderModal } from './components/CustomProviderModal';
import { SecurityTrustModal } from './components/SecurityTrustModal';
import { FreeTierGuideModal } from './components/FreeTierGuideModal';
import { ValidationResult, CustomProvider, SavedKey } from './types';
import { getSavedKeys, getCustomProviders } from './utils/storage';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('validate');
  const [savedKeys, setSavedKeys] = useState<SavedKey[]>([]);
  const [savedKeysCount, setSavedKeysCount] = useState<number>(0);
  const [customProviders, setCustomProviders] = useState<CustomProvider[]>([]);

  const [lastValidationResult, setLastValidationResult] = useState<ValidationResult | null>(null);
  const [lastValidatedProviderId, setLastValidatedProviderId] = useState<string>('openai');

  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isFreeTierGuideOpen, setIsFreeTierGuideOpen] = useState<boolean>(false);

  const loadInitialData = async () => {
    const keys = await getSavedKeys();
    setSavedKeys(keys);
    setSavedKeysCount(keys.length);
    const customProvs = await getCustomProviders();
    setCustomProviders(customProvs);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleValidationComplete = (result: ValidationResult, providerId: string) => {
    setLastValidationResult(result);
    setLastValidatedProviderId(providerId);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedKeysCount={savedKeysCount}
        openCustomProviderModal={() => setIsCustomModalOpen(true)}
        openSecurityModal={() => setIsSecurityModalOpen(true)}
      />

      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        {activeTab === 'validate' && (
          <div className="space-y-4">
            <ValidateForm
              customProviders={customProviders}
              onValidationComplete={handleValidationComplete}
              onKeySaved={loadInitialData}
              onOpenFreeTierGuide={() => setIsFreeTierGuideOpen(true)}
            />

            {lastValidationResult?.valid && (
              <ModelPicker
                models={lastValidationResult.models}
                providerId={lastValidatedProviderId}
              />
            )}
          </div>
        )}

        {activeTab === 'vault' && (
          <SavedVault
            savedKeys={savedKeys}
            customProviders={customProviders}
            onKeysChanged={loadInitialData}
          />
        )}

        {activeTab === 'inspector' && <ExchangeInspector />}

        {activeTab === 'sender' && <CustomRequestSender />}

        {activeTab === 'tools' && (
          <ToolsTab customProviders={customProviders} onKeysChanged={loadInitialData} />
        )}
      </main>

      <CustomProviderModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onProviderSaved={loadInitialData}
      />

      <SecurityTrustModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      <FreeTierGuideModal
        isOpen={isFreeTierGuideOpen}
        onClose={() => setIsFreeTierGuideOpen(false)}
      />
    </div>
  );
}

export default App;
