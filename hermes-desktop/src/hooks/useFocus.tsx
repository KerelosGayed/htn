import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export interface FocusableItem {
  id: string;
  element?: HTMLElement;
  onActivate?: () => void;
  disabled?: boolean;
}

interface FocusContextValue {
  focusedId: string | null;
  focusableItems: Map<string, FocusableItem>;
  registerFocusable: (item: FocusableItem) => void;
  unregisterFocusable: (id: string) => void;
  setFocus: (id: string | null) => void;
  moveFocus: (direction: 'up' | 'down' | 'left' | 'right') => void;
  activateFocused: () => void;
  getFocusableIds: () => string[];
  clearFocus: () => void;
}

const FocusContext = createContext<FocusContextValue | null>(null);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focusableItemsRef = useRef<Map<string, FocusableItem>>(new Map());
  const focusOrderRef = useRef<string[]>([]);

  const registerFocusable = useCallback((item: FocusableItem) => {
    focusableItemsRef.current.set(item.id, item);
    if (!focusOrderRef.current.includes(item.id)) {
      focusOrderRef.current.push(item.id);
    }
    
    // If this is the first focusable item and nothing is focused, focus it
    if (focusableItemsRef.current.size === 1 && !focusedId) {
      setFocusedId(item.id);
    }
  }, [focusedId]);

  const unregisterFocusable = useCallback((id: string) => {
    focusableItemsRef.current.delete(id);
    focusOrderRef.current = focusOrderRef.current.filter(itemId => itemId !== id);
    
    if (focusedId === id) {
      // Focus the next available item or clear focus
      const availableIds = getFocusableIds();
      setFocusedId(availableIds.length > 0 ? availableIds[0] : null);
    }
  }, [focusedId]);

  const getFocusableIds = useCallback((): string[] => {
    return focusOrderRef.current.filter(id => {
      const item = focusableItemsRef.current.get(id);
      return item && !item.disabled;
    });
  }, []);

  const setFocus = useCallback((id: string | null) => {
    if (id && focusableItemsRef.current.has(id)) {
      const item = focusableItemsRef.current.get(id);
      if (item && !item.disabled) {
        setFocusedId(id);
        // Scroll into view if element exists
        if (item.element) {
          item.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    } else {
      setFocusedId(id);
    }
  }, []);

  const moveFocus = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const availableIds = getFocusableIds();
    if (availableIds.length === 0) return;

    const currentIndex = focusedId ? availableIds.indexOf(focusedId) : -1;
    let nextIndex: number;

    switch (direction) {
      case 'up':
      case 'left':
        nextIndex = currentIndex <= 0 ? availableIds.length - 1 : currentIndex - 1;
        break;
      case 'down':
      case 'right':
        nextIndex = currentIndex >= availableIds.length - 1 ? 0 : currentIndex + 1;
        break;
    }

    setFocus(availableIds[nextIndex]);
  }, [focusedId, getFocusableIds, setFocus]);

  const activateFocused = useCallback(() => {
    if (focusedId) {
      const item = focusableItemsRef.current.get(focusedId);
      if (item && !item.disabled) {
        item.onActivate?.();
        // Also trigger click event if element exists
        if (item.element) {
          item.element.click();
        }
      }
    }
  }, [focusedId]);

  const clearFocus = useCallback(() => {
    setFocusedId(null);
    focusableItemsRef.current.clear();
    focusOrderRef.current = [];
  }, []);

  const contextValue: FocusContextValue = {
    focusedId,
    focusableItems: focusableItemsRef.current,
    registerFocusable,
    unregisterFocusable,
    setFocus,
    moveFocus,
    activateFocused,
    getFocusableIds,
    clearFocus
  };

  return (
    <FocusContext.Provider value={contextValue}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
}

// Hook for components that want to be focusable
export function useFocusable(id: string, onActivate?: () => void, disabled: boolean = false) {
  const { registerFocusable, unregisterFocusable, focusedId } = useFocus();
  const elementRef = useRef<HTMLElement>(null);
  const isFocused = focusedId === id;

  useEffect(() => {
    const item: FocusableItem = {
      id,
      element: elementRef.current || undefined,
      onActivate,
      disabled
    };
    
    registerFocusable(item);
    
    return () => unregisterFocusable(id);
  }, [id, onActivate, disabled, registerFocusable, unregisterFocusable]);

  // Update element reference when it changes
  useEffect(() => {
    if (elementRef.current) {
      const item = { 
        id, 
        element: elementRef.current, 
        onActivate, 
        disabled 
      };
      registerFocusable(item);
    }
  }, [id, onActivate, disabled, registerFocusable]);

  return {
    elementRef,
    isFocused,
    focusProps: {
      ref: elementRef,
      'data-focused': isFocused,
      tabIndex: isFocused ? 0 : -1,
    }
  };
}