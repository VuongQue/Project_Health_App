import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MutableRefObject } from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

export interface TourStepConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Route để navigate khi bấm "Thử ngay" */
  actionRoute?: string;
  actionLabel?: string;
  /** Màu gradient chủ đạo của card */
  gradient: [string, string];
  /** Features list hiển thị trong card */
  features?: string[];
}

interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TourContextValue {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: TourStepConfig | null;
  targetLayout: LayoutRect | null;
  totalSteps: number;
  registerRef: (id: string, ref: MutableRefObject<any>) => void;
  unregisterRef: (id: string) => void;
  measureStep: (id: string) => Promise<LayoutRect | null>;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  goToStep: (index: number) => void;
}

const TOUR_META = [
  { id: 'welcome', icon: '🤖', gradient: ['#1a237e', '#283593'] as [string, string], actionRoute: undefined, featureCount: 3 },
  { id: 'xp_bar', icon: '⭐', gradient: ['#7B5800', '#5c3d00'] as [string, string], actionRoute: '/achievements', featureCount: 4 },
  { id: 'fitness', icon: '🏋️', gradient: ['#1a3a1a', '#0d2a0d'] as [string, string], actionRoute: '/(tabs)/(personal)/fitness', featureCount: 4 },
  { id: 'mood', icon: '🧠', gradient: ['#1a0a2e', '#12052a'] as [string, string], actionRoute: '/(tabs)/(personal)/mood', featureCount: 4 },
  { id: 'water', icon: '💧', gradient: ['#003344', '#001f2e'] as [string, string], actionRoute: '/(tabs)/(personal)/water-intake', featureCount: 4 },
  { id: 'steps', icon: '🚶', gradient: ['#0a1a3a', '#081226'] as [string, string], actionRoute: '/(tabs)/(personal)/steps', featureCount: 4 },
  { id: 'notifications', icon: '🔔', gradient: ['#3a2200', '#281800'] as [string, string], actionRoute: '/reminders', featureCount: 4 },
  { id: 'community', icon: '👥', gradient: ['#003322', '#001f14'] as [string, string], actionRoute: '/(tabs)/(community)/feed', featureCount: 4 },
  { id: 'achievements', icon: '🏅', gradient: ['#2a1a00', '#1a1000'] as [string, string], actionRoute: '/achievements', featureCount: 4 },
];

export function buildTourSteps(t: TFunction): TourStepConfig[] {
  return TOUR_META.map((m) => {
    const base = `tour.steps.${m.id}`;
    const features: string[] = [];
    for (let i = 0; i < m.featureCount; i++) {
      features.push(t(`${base}.f${i}`));
    }
    return {
      id: m.id,
      title: t(`${base}.title`),
      description: t(`${base}.description`),
      icon: m.icon,
      gradient: m.gradient,
      features,
      actionRoute: m.actionRoute,
      actionLabel: m.actionRoute ? t(`${base}.action`, { defaultValue: '' }) : undefined,
    };
  });
}

export const TOUR_STEPS = TOUR_META;

const TOUR_DONE_KEY = '@tour_completed';

export const TourContext = createContext<TourContextValue>({
  isActive: false,
  currentStepIndex: 0,
  currentStep: null,
  targetLayout: null,
  totalSteps: TOUR_META.length,
  registerRef: () => {},
  unregisterRef: () => {},
  measureStep: async () => null,
  startTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipTour: () => {},
  goToStep: () => {},
});

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetLayout, setTargetLayout] = useState<LayoutRect | null>(null);

  const steps = useMemo(() => buildTourSteps(t), [t]);

  const refsMap = useRef<Map<string, MutableRefObject<any>>>(new Map());

  const registerRef = useCallback((id: string, ref: MutableRefObject<any>) => {
    refsMap.current.set(id, ref);
  }, []);

  const unregisterRef = useCallback((id: string) => {
    refsMap.current.delete(id);
  }, []);

  const measureStep = useCallback(async (id: string): Promise<LayoutRect | null> => {
    const ref = refsMap.current.get(id);
    if (!ref?.current) return null;
    return new Promise((resolve) => {
      ref.current.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (width === 0 && height === 0) resolve(null);
        else resolve({ x, y, width, height });
      });
    });
  }, []);

  const showStep = useCallback(async (index: number) => {
    const step = steps[index];
    if (!step) return;
    setCurrentStepIndex(index);
    setTargetLayout(null);
  }, [steps]);

  const startTour = useCallback(async () => {
    setIsActive(true);
    await showStep(0);
  }, [showStep]);

  const nextStep = useCallback(async () => {
    const next = currentStepIndex + 1;
    if (next >= steps.length) {
      setIsActive(false);
      setTargetLayout(null);
      await AsyncStorage.setItem(TOUR_DONE_KEY, 'true');
    } else {
      await showStep(next);
    }
  }, [currentStepIndex, showStep, steps.length]);

  const prevStep = useCallback(async () => {
    const prev = currentStepIndex - 1;
    if (prev >= 0) await showStep(prev);
  }, [currentStepIndex, showStep]);

  const skipTour = useCallback(async () => {
    setIsActive(false);
    setTargetLayout(null);
    await AsyncStorage.setItem(TOUR_DONE_KEY, 'true');
  }, []);

  const goToStep = useCallback(async (index: number) => {
    if (index >= 0 && index < steps.length) await showStep(index);
  }, [showStep, steps.length]);

  const currentStep = isActive ? steps[currentStepIndex] : null;

  return (
    <TourContext.Provider value={{
      isActive,
      currentStepIndex,
      currentStep,
      targetLayout,
      totalSteps: steps.length,
      registerRef,
      unregisterRef,
      measureStep,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      goToStep,
    }}>
      {children}
    </TourContext.Provider>
  );
}

export const useTour = () => useContext(TourContext);

export async function isTourCompleted(): Promise<boolean> {
  const val = await AsyncStorage.getItem(TOUR_DONE_KEY);
  return val === 'true';
}

export async function resetTour(): Promise<void> {
  await AsyncStorage.removeItem(TOUR_DONE_KEY);
}
