import { useEffect, useMemo, useState } from 'react';
import type { SessionLog } from '../../types/sessionLog';
import { isBackendReachabilityError } from '../../utils/apiClient';
import {
  deriveDateInputForDayOffset,
  deriveDateRangeFromInputs,
  deriveSummarySnapshot,
  type SummarySnapshotData,
} from '../../utils/summary';
import { loadCachedSummarySnapshotData, loadSummaryFromApi } from '../../utils/summaryApi';
import {
  describeSummaryRangeLabel,
  formatCachedSummaryFallbackMessage,
  formatCachedSummaryLoadMessage,
  formatSummaryLoadMessage,
  formatUnavailableSummaryMessage,
  type SummaryRangePreset,
} from './sankalpaPageHelpers';

interface UseSankalpaSummaryOptions {
  readonly sessionLogs: readonly SessionLog[];
  readonly connectionMode: 'offline' | 'backend-unreachable' | 'online';
  readonly canAttemptBackendSync: boolean;
  readonly reportBackendReachable: () => void;
  readonly reportBackendUnreachable: (error?: unknown) => void;
  readonly userTimeZone: string;
}

export function useSankalpaSummary({
  sessionLogs,
  connectionMode,
  canAttemptBackendSync,
  reportBackendReachable,
  reportBackendUnreachable,
  userTimeZone,
}: UseSankalpaSummaryOptions) {
  const summaryDateDefaults = useMemo(() => {
    const today = new Date();
    return {
      todayDateInput: deriveDateInputForDayOffset(today, 0),
      last7StartInput: deriveDateInputForDayOffset(today, -6),
      last30StartInput: deriveDateInputForDayOffset(today, -29),
    };
  }, []);
  const [summaryRangePreset, setSummaryRangePreset] = useState<SummaryRangePreset>('all-time');
  const [customStartDate, setCustomStartDate] = useState(summaryDateDefaults.last7StartInput);
  const [customEndDate, setCustomEndDate] = useState(summaryDateDefaults.todayDateInput);
  const [showInactiveSummaryCategories, setShowInactiveSummaryCategories] = useState(false);
  const [remoteSummarySnapshot, setRemoteSummarySnapshot] = useState<SummarySnapshotData | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryLoadMessage, setSummaryLoadMessage] = useState<string | null>(null);

  const summaryRangeSelection = useMemo(() => {
    if (summaryRangePreset === 'all-time') {
      const range = { startAtMs: null, endAtMs: null };
      return {
        range,
        error: null as string | null,
        label: describeSummaryRangeLabel(summaryRangePreset, range, customStartDate, customEndDate),
      };
    }

    if (summaryRangePreset === 'last-7-days') {
      const range =
        deriveDateRangeFromInputs(summaryDateDefaults.last7StartInput, summaryDateDefaults.todayDateInput) ?? {
          startAtMs: null,
          endAtMs: null,
        };
      return {
        range,
        error: null as string | null,
        label: describeSummaryRangeLabel(summaryRangePreset, range, customStartDate, customEndDate),
      };
    }

    if (summaryRangePreset === 'last-30-days') {
      const range =
        deriveDateRangeFromInputs(summaryDateDefaults.last30StartInput, summaryDateDefaults.todayDateInput) ?? {
          startAtMs: null,
          endAtMs: null,
        };
      return {
        range,
        error: null as string | null,
        label: describeSummaryRangeLabel(summaryRangePreset, range, customStartDate, customEndDate),
      };
    }

    if (!customStartDate || !customEndDate) {
      return {
        range: null,
        error: 'Select both start and end dates for a custom range.',
        label: 'Custom range',
      };
    }

    const range = deriveDateRangeFromInputs(customStartDate, customEndDate);
    if (!range) {
      return {
        range: null,
        error: 'Custom date range is invalid. Ensure start is on or before end.',
        label: 'Custom range',
      };
    }

    return {
      range,
      error: null as string | null,
      label: describeSummaryRangeLabel(summaryRangePreset, range, customStartDate, customEndDate),
    };
  }, [customEndDate, customStartDate, summaryDateDefaults, summaryRangePreset]);

  const summarySnapshot = useMemo(() => {
    if (!summaryRangeSelection.range) {
      return null;
    }

    return deriveSummarySnapshot(sessionLogs, summaryRangeSelection.range);
  }, [sessionLogs, summaryRangeSelection.range]);
  const effectiveSummarySnapshot = remoteSummarySnapshot ?? summarySnapshot;

  useEffect(() => {
    if (!summaryRangeSelection.range) {
      setRemoteSummarySnapshot(null);
      setIsSummaryLoading(false);
      setSummaryLoadMessage(null);
      return;
    }

    const summaryRequest = {
      startAt:
        summaryRangeSelection.range.startAtMs === null ? undefined : new Date(summaryRangeSelection.range.startAtMs).toISOString(),
      endAt: summaryRangeSelection.range.endAtMs === null ? undefined : new Date(summaryRangeSelection.range.endAtMs).toISOString(),
      timeZone: userTimeZone,
    };
    const cachedSummarySnapshot = loadCachedSummarySnapshotData(summaryRequest);

    if (!canAttemptBackendSync) {
      setRemoteSummarySnapshot(cachedSummarySnapshot);
      setIsSummaryLoading(false);
      setSummaryLoadMessage(
        cachedSummarySnapshot ? formatCachedSummaryFallbackMessage(connectionMode) : formatUnavailableSummaryMessage(connectionMode)
      );
      return;
    }

    const controller = new AbortController();
    setIsSummaryLoading(true);
    setSummaryLoadMessage(null);

    loadSummaryFromApi(summaryRequest, undefined, controller.signal)
      .then((nextSummarySnapshot) => {
        setRemoteSummarySnapshot(nextSummarySnapshot);
        reportBackendReachable();
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (isBackendReachabilityError(error)) {
          reportBackendUnreachable(error);
        }

        setRemoteSummarySnapshot(cachedSummarySnapshot);
        setSummaryLoadMessage(cachedSummarySnapshot ? formatCachedSummaryLoadMessage(error) : formatSummaryLoadMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsSummaryLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [
    canAttemptBackendSync,
    connectionMode,
    reportBackendReachable,
    reportBackendUnreachable,
    summaryRangeSelection.range,
    userTimeZone,
  ]);

  const inactiveSummaryCategoriesCount = useMemo(() => {
    if (!effectiveSummarySnapshot) {
      return 0;
    }

    const byTypeInactiveCount = effectiveSummarySnapshot.byTypeSummary.filter((entry) => entry.sessionLogs === 0).length;
    const byTimeOfDayInactiveCount = effectiveSummarySnapshot.byTimeOfDaySummary.filter((entry) => entry.sessionLogs === 0).length;
    return byTypeInactiveCount + byTimeOfDayInactiveCount;
  }, [effectiveSummarySnapshot]);

  const byTypeSummaryRows = useMemo(() => {
    if (!effectiveSummarySnapshot) {
      return [];
    }

    return showInactiveSummaryCategories
      ? effectiveSummarySnapshot.byTypeSummary
      : effectiveSummarySnapshot.byTypeSummary.filter((entry) => entry.sessionLogs > 0);
  }, [effectiveSummarySnapshot, showInactiveSummaryCategories]);

  const byTimeOfDaySummaryRows = useMemo(() => {
    if (!effectiveSummarySnapshot) {
      return [];
    }

    return showInactiveSummaryCategories
      ? effectiveSummarySnapshot.byTimeOfDaySummary
      : effectiveSummarySnapshot.byTimeOfDaySummary.filter((entry) => entry.sessionLogs > 0);
  }, [effectiveSummarySnapshot, showInactiveSummaryCategories]);

  return {
    summaryDateDefaults,
    summaryRangePreset,
    setSummaryRangePreset,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    showInactiveSummaryCategories,
    setShowInactiveSummaryCategories,
    isSummaryLoading,
    summaryLoadMessage,
    summaryRangeSelection,
    effectiveSummarySnapshot,
    inactiveSummaryCategoriesCount,
    byTypeSummaryRows,
    byTimeOfDaySummaryRows,
    hasAnySessionLogs: sessionLogs.length > 0,
  };
}
