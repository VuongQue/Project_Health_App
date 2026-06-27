import React, {
  createContext, useCallback, useContext, useRef, useState,
} from 'react';
import { UIManager, findNodeHandle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScreenTourStep {
  id: string;
  placement: 'top' | 'bottom';
  title: string;
  body: string;
  icon?: string;
}

export interface ScreenTourLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScreenTourState {
  screenId: string;
  steps: ScreenTourStep[];
  stepIndex: number;
  layout: ScreenTourLayout | null;
}

interface ScreenTourContextValue {
  state: ScreenTourState | null;
  startScreenTour: (screenId: string, steps: ScreenTourStep[]) => Promise<void>;
  reportLayout: (layout: ScreenTourLayout) => void;
  next: () => void;
  skip: () => void;
}

const ScreenTourContext = createContext<ScreenTourContextValue>({
  state: null,
  startScreenTour: async () => {},
  reportLayout: () => {},
  next: () => {},
  skip: () => {},
});

const doneKey = (screenId: string) => `@screen_tour_done_${screenId}`;

export function ScreenTourProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ScreenTourState | null>(null);

  const startScreenTour = useCallback(async (
    screenId: string,
    steps: ScreenTourStep[],
  ) => {
    if (!steps.length) return;
    // Don't restart if a tour is already active
    setState((current) => {
      if (current !== null) return current;
      return current;
    });
    const done = await AsyncStorage.getItem(doneKey(screenId));
    if (done === 'true') return;
    setState((current) => {
      // Still skip if a tour became active while we were awaiting AsyncStorage
      if (current !== null) return current;
      return { screenId, steps, stepIndex: 0, layout: null };
    });
  }, []);

  const reportLayout = useCallback((layout: ScreenTourLayout) => {
    setState((prev) => prev ? { ...prev, layout } : prev);
  }, []);

  const next = useCallback(() => {
    setState((prev) => {
      if (!prev) return null;
      const nextIndex = prev.stepIndex + 1;
      if (nextIndex >= prev.steps.length) {
        AsyncStorage.setItem(doneKey(prev.screenId), 'true');
        return null;
      }
      return { ...prev, stepIndex: nextIndex, layout: null };
    });
  }, []);

  const skip = useCallback(() => {
    setState((prev) => {
      if (prev) AsyncStorage.setItem(doneKey(prev.screenId), 'true');
      return null;
    });
  }, []);

  return (
    <ScreenTourContext.Provider value={{ state, startScreenTour, reportLayout, next, skip }}>
      {children}
    </ScreenTourContext.Provider>
  );
}

export const useScreenTour = () => useContext(ScreenTourContext);

/**
 * Hook used per-element inside a screen that has a screen tour.
 * Attach `ref` to the target element and call `measure()` when ready.
 * `isActiveStep` is true when this element is the current highlight target.
 */
export function useScreenTourStep(stepIndex: number) {
  const { state, reportLayout } = useScreenTour();
  const ref = useRef<any>(null);

  const isActiveStep =
    state !== null &&
    state.stepIndex === stepIndex &&
    state.layout === null;

  const measure = useCallback(() => {
    if (!ref.current || !isActiveStep) return;
    setTimeout(() => {
      if (!ref.current) return;
      try {
        const node = findNodeHandle(ref.current);
        if (!node) return;
        UIManager.measure(node, (_, __, width, height, x, y) => {
          if (width > 0 || height > 0) {
            reportLayout({ x, y, width, height });
          }
        });
      } catch {
        // ref may not be a native view — silently skip
      }
    }, 80);
  }, [isActiveStep, reportLayout]);

  return { ref, isActiveStep, measure };
}

/** Reset a specific screen's tour (for Settings "replay tour" button) */
export async function resetScreenTour(screenId: string) {
  await AsyncStorage.removeItem(doneKey(screenId));
}

export async function resetAllScreenTours(screenIds: string[]) {
  await Promise.all(screenIds.map((id) => AsyncStorage.removeItem(doneKey(id))));
}

export const ALL_SCREEN_TOUR_IDS = [
  'home', 'fitness', 'mood', 'water', 'steps',
  'food', 'community', 'profile', 'achievements',
];
