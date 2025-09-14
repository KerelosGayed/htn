import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HomeScreen } from './screens/HomeScreen';
import { StartStreamingScreen } from './screens/StartStreamingScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { FocusProvider } from '../hooks/useFocus';

export type Screen = 'home' | 'start' | 'settings' | 'library';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <FocusProvider>
      <div className="min-h-screen w-screen overflow-hidden bg-gradient-to-b from-white to-leaf-50 text-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 180, damping: 20 }}
            className="h-full"
          >
            {screen === 'home' && (
              <HomeScreen onStart={() => setScreen('start')} onSettings={() => setScreen('settings')} onLibrary={() => setScreen('library')} />
            )}
            {screen === 'start' && <StartStreamingScreen onBack={() => setScreen('home')} />}
            {screen === 'settings' && <SettingsScreen onBack={() => setScreen('home')} />}
            {screen === 'library' && <LibraryScreen onBack={() => setScreen('home')} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </FocusProvider>
  );
}
