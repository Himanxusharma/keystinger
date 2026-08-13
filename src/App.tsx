import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { ValidateForm } from './components/ValidateForm';
import { ModelPicker } from './components/ModelPicker';
import { SavedVault } from './components/SavedVault';
import { ExchangeInspector } from './components/ExchangeInspector';
import { CustomRequestSender } from './components/CustomRequestSender';
import { CustomProviderModal } from './components/CustomProviderModal';
import { ValidationResult, CustomProvider } from './types';
import { getSavedKeys, getCustomProviders } from './utils/storage';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('validate');
  const [savedKeysCount, setSavedKeysCount] = useState<number>(0);
  const [customProviders, setCustomProviders] = useState<CustomProvider[]>([]);

  const [lastValidationResult, setLastValidationResult] = useState<ValidationResult | null>(null);
  const [lastValidatedProviderId, setLastValidatedProviderId] = useState<string>('openai');

  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);

  const loadInitialData = async () => {
    const keys = await getSavedKeys();
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedKeysCount={savedKeysCount}
        openCustomProviderModal={() => setIsCustomModalOpen(true)}
      />

      <main className="flex-1 p-4 space-y-4 max-w-[400px] mx-auto w-full">
        {activeTab === 'validate' && (
          <>
            <ValidateForm
              customProviders={customProviders}
              onValidationComplete={handleValidationComplete}
              onKeySaved={loadInitialData}
            />

            {lastValidationResult && lastValidationResult.valid && (
              <ModelPicker
                models={lastValidationResult.models}
                providerId={lastValidatedProviderId}
              />
            )}
          </>
        )}

        {activeTab === 'vault' && (
          <SavedVault
            customProviders={customProviders}
            onKeysChanged={loadInitialData}
          />
        )}

        {activeTab === 'inspector' && <ExchangeInspector />}

        {activeTab === 'sender' && <CustomRequestSender />}
      </main>

      <CustomProviderModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onProviderSaved={loadInitialData}
      />
    </div>
  );
}

export default App;
