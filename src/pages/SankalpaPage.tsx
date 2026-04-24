import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { SankalpaEditor } from '../features/sankalpa/SankalpaEditor';
import { SankalpaSection } from '../features/sankalpa/SankalpaSection';
import { SankalpaSummaryPanel } from '../features/sankalpa/SankalpaSummaryPanel';
import {
  buildSankalpaSaveMessage,
  type SaveMessageTone,
  type SankalpaSaveAction,
} from '../features/sankalpa/sankalpaPageHelpers';
import { useSankalpaSummary } from '../features/sankalpa/useSankalpaSummary';
import { useSyncStatus } from '../features/sync/useSyncStatus';
import { useSankalpaProgress } from '../features/sankalpa/useSankalpaProgress';
import { useTimer } from '../features/timer/useTimer';
import type { SankalpaGoal, SankalpaValidationResult } from '../types/sankalpa';
import {
  archiveSankalpaGoal,
  createInitialSankalpaDraft,
  createSankalpaDraftFromGoal,
  createSankalpaGoal,
  partitionSankalpaProgress,
  setSankalpaObservanceStatus,
  unarchiveSankalpaGoal,
  updateSankalpaGoal,
  validateSankalpaDraft,
} from '../utils/sankalpa';
import { getUserTimeZone } from '../utils/timeZone';

const initialErrors: SankalpaValidationResult['errors'] = {};

export default function SankalpaPage() {
  const { sessionLogs } = useTimer();
  const { connectionMode, canAttemptBackendSync, reportBackendReachable, reportBackendUnreachable } = useSyncStatus();
  const userTimeZone = useMemo(() => getUserTimeZone() ?? 'UTC', []);
  const [draft, setDraft] = useState(() => createInitialSankalpaDraft());
  const [errors, setErrors] = useState<SankalpaValidationResult['errors']>(initialErrors);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveMessageTone, setSaveMessageTone] = useState<SaveMessageTone>('ok');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [pendingArchiveGoalId, setPendingArchiveGoalId] = useState<string | null>(null);
  const [pendingDeleteGoalId, setPendingDeleteGoalId] = useState<string | null>(null);
  const {
    progressEntries: sankalpaProgressEntries,
    isLoading: isSankalpaLoading,
    syncMessage: sankalpaSyncMessage,
    saveSankalpa,
    deleteSankalpa,
  } =
    useSankalpaProgress(sessionLogs);
  const {
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
    hasAnySessionLogs,
  } = useSankalpaSummary({
    sessionLogs,
    connectionMode,
    canAttemptBackendSync,
    reportBackendReachable,
    reportBackendUnreachable,
    userTimeZone,
  });
  const progressByStatus = useMemo(() => {
    return partitionSankalpaProgress(sankalpaProgressEntries);
  }, [sankalpaProgressEntries]);

  function resetDraftState() {
    setDraft(createInitialSankalpaDraft());
    setErrors(initialErrors);
    setEditingGoalId(null);
  }

  function beginEdit(goal: SankalpaGoal) {
    setDraft(createSankalpaDraftFromGoal(goal));
    setErrors(initialErrors);
    setSaveMessage(null);
    setEditingGoalId(goal.id);
    setPendingArchiveGoalId(null);
    setPendingDeleteGoalId(null);
  }

  function cancelEdit() {
    resetDraftState();
    setSaveMessage(null);
  }

  async function persistGoal(goal: SankalpaGoal, action: SankalpaSaveAction) {
    const result = await saveSankalpa(goal);
    if (action !== 'mark-observance') {
      resetDraftState();
    }
    setPendingArchiveGoalId(null);
    setPendingDeleteGoalId(null);
    setSaveMessageTone(result.tone);
    setSaveMessage(buildSankalpaSaveMessage(action, result.tone));
  }

  async function removeGoal(goalId: string) {
    const result = await deleteSankalpa(goalId);
    resetDraftState();
    setPendingArchiveGoalId(null);
    setPendingDeleteGoalId(null);
    setSaveMessageTone(result.tone);
    setSaveMessage(buildSankalpaSaveMessage('delete', result.tone));
  }

  async function onSubmitSankalpa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateSankalpaDraft(draft);
    setErrors(validation.errors);

    if (!validation.isValid) {
      setSaveMessage(null);
      return;
    }

    const existingGoal = editingGoalId
      ? sankalpaProgressEntries.find((entry) => entry.goal.id === editingGoalId)?.goal ?? null
      : null;
    const nextGoal = existingGoal ? updateSankalpaGoal(existingGoal, draft) : createSankalpaGoal(draft, new Date());
    await persistGoal(nextGoal, existingGoal ? 'edit' : 'create');
  }

  async function confirmArchive(goal: SankalpaGoal) {
    if (editingGoalId === goal.id) {
      resetDraftState();
    }

    await persistGoal(archiveSankalpaGoal(goal), 'archive');
  }

  async function unarchiveGoal(goal: SankalpaGoal) {
    if (editingGoalId === goal.id) {
      resetDraftState();
    }

    await persistGoal(unarchiveSankalpaGoal(goal), 'unarchive');
  }

  async function confirmDelete(goal: SankalpaGoal) {
    if (editingGoalId === goal.id) {
      resetDraftState();
    }

    await removeGoal(goal.id);
  }

  async function updateObservanceStatus(goal: SankalpaGoal, date: string, status: 'pending' | 'observed' | 'missed') {
    await persistGoal(setSankalpaObservanceStatus(goal, date, status), 'mark-observance');
  }

  return (
    <section className="page-card sankalpa-screen">
      <h2 className="page-title">Sankalpa</h2>
      <p className="page-description">
        Review summaries and track sankalpa progress with clear, bounded goals.
      </p>

      <details className="page-disclosure" open={progressByStatus.active.length === 0}>
        <summary className="page-disclosure-summary">View Summary Details</summary>
        <SankalpaSummaryPanel
          summaryRangePreset={summaryRangePreset}
          setSummaryRangePreset={setSummaryRangePreset}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
          summaryDateDefaults={summaryDateDefaults}
          summaryRangeSelection={summaryRangeSelection}
          isSummaryLoading={isSummaryLoading}
          summaryLoadMessage={summaryLoadMessage}
          hasAnySessionLogs={hasAnySessionLogs}
          effectiveSummarySnapshot={effectiveSummarySnapshot}
          inactiveSummaryCategoriesCount={inactiveSummaryCategoriesCount}
          showInactiveSummaryCategories={showInactiveSummaryCategories}
          setShowInactiveSummaryCategories={setShowInactiveSummaryCategories}
          byTypeSummaryRows={byTypeSummaryRows}
          byTimeOfDaySummaryRows={byTimeOfDaySummaryRows}
        />
      </details>

      <SankalpaSection
        title="Active Sankalpas"
        emptyText="No active sankalpas. Create one below."
        items={progressByStatus.active}
        pendingArchiveGoalId={pendingArchiveGoalId}
        pendingDeleteGoalId={pendingDeleteGoalId}
        onEditGoal={beginEdit}
        onStartArchive={setPendingArchiveGoalId}
        onCancelArchive={() => setPendingArchiveGoalId(null)}
        onConfirmArchive={confirmArchive}
        onUpdateObservanceStatus={updateObservanceStatus}
      />

      <details className="page-disclosure" open={editingGoalId !== null || progressByStatus.active.length === 0}>
        <summary className="page-disclosure-summary">{editingGoalId ? 'Edit Sankalpa' : 'New Sankalpa'}</summary>
        <SankalpaEditor
          draft={draft}
          errors={errors}
          editingGoalId={editingGoalId}
          saveMessage={saveMessage}
          saveMessageTone={saveMessageTone}
          isSankalpaLoading={isSankalpaLoading}
          sankalpaSyncMessage={sankalpaSyncMessage}
          onSubmit={onSubmitSankalpa}
          onCancelEdit={cancelEdit}
          onChangeDraft={(updater) => setDraft((current) => updater(current))}
          onClearSaveMessage={() => setSaveMessage(null)}
        />
      </details>

      <details className="page-disclosure">
        <summary className="page-disclosure-summary">Completed Sankalpas ({progressByStatus.completed.length})</summary>
        <SankalpaSection
          title="Completed Sankalpas"
          emptyText="Completed sankalpas will appear here."
          items={progressByStatus.completed}
          pendingArchiveGoalId={pendingArchiveGoalId}
          pendingDeleteGoalId={pendingDeleteGoalId}
          onEditGoal={beginEdit}
          onStartArchive={setPendingArchiveGoalId}
          onCancelArchive={() => setPendingArchiveGoalId(null)}
          onConfirmArchive={confirmArchive}
          onUpdateObservanceStatus={updateObservanceStatus}
        />
      </details>
      <details className="page-disclosure">
        <summary className="page-disclosure-summary">Expired Sankalpas ({progressByStatus.expired.length})</summary>
        <SankalpaSection
          title="Expired Sankalpas"
          emptyText="Expired sankalpas will appear here if deadlines pass before completion."
          items={progressByStatus.expired}
          pendingArchiveGoalId={pendingArchiveGoalId}
          pendingDeleteGoalId={pendingDeleteGoalId}
          onEditGoal={beginEdit}
          onStartArchive={setPendingArchiveGoalId}
          onCancelArchive={() => setPendingArchiveGoalId(null)}
          onConfirmArchive={confirmArchive}
          onUpdateObservanceStatus={updateObservanceStatus}
        />
      </details>
      <details className="page-disclosure">
        <summary className="page-disclosure-summary">Archived Sankalpas ({progressByStatus.archived.length})</summary>
        <SankalpaSection
          title="Archived Sankalpas"
          emptyText="Archived sankalpas will appear here."
          items={progressByStatus.archived}
          pendingArchiveGoalId={pendingArchiveGoalId}
          pendingDeleteGoalId={pendingDeleteGoalId}
          onUnarchiveGoal={unarchiveGoal}
          onStartDelete={(goalId) => {
            setPendingArchiveGoalId(null);
            setPendingDeleteGoalId(goalId);
          }}
          onCancelDelete={() => setPendingDeleteGoalId(null)}
          onConfirmDelete={confirmDelete}
          onUpdateObservanceStatus={updateObservanceStatus}
        />
      </details>
    </section>
  );
}
