import type { CustomPlay } from '../../types/customPlay';
import type { ActiveCustomPlayRun } from '../../types/customPlay';
import type { MediaAssetMetadata } from '../../types/mediaAsset';
import { describeLinkedMedia } from './customPlayManagerHelpers';

interface CustomPlayCollectionProps {
  readonly customPlays: readonly CustomPlay[];
  readonly mediaAssets: readonly MediaAssetMetadata[];
  readonly activeCustomPlayRun: ActiveCustomPlayRun | null;
  readonly appliedPlayId: string | null;
  readonly pendingDeleteId: string | null;
  readonly controlsDisabled: boolean;
  readonly isMediaCatalogLoading: boolean;
  readonly onStartCustomPlay: (playId: string) => void;
  readonly onApplyCustomPlay: (playId: string) => void;
  readonly onStartEdit: (playId: string) => void;
  readonly onToggleFavorite: (playId: string) => Promise<unknown>;
  readonly onRequestDelete: (playId: string) => void;
  readonly onCancelDelete: () => void;
  readonly onConfirmDelete: (playId: string) => Promise<unknown>;
  readonly onClearFeedback: () => void;
}

export function CustomPlayCollection({
  customPlays,
  mediaAssets,
  activeCustomPlayRun,
  appliedPlayId,
  pendingDeleteId,
  controlsDisabled,
  isMediaCatalogLoading,
  onStartCustomPlay,
  onApplyCustomPlay,
  onStartEdit,
  onToggleFavorite,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onClearFeedback,
}: CustomPlayCollectionProps) {
  return (
    <div className="custom-play-collection" aria-live="polite">
      {customPlays.length === 0 ? (
        <div className="empty-state">
          <p>No custom play entries yet.</p>
          <p>Create one to quickly reuse your preferred setup.</p>
        </div>
      ) : (
        <ul className="custom-play-list">
          {customPlays.map((play) => {
            const linkedAsset = play.mediaAssetId ? mediaAssets.find((asset) => asset.id === play.mediaAssetId) : null;
            const startDisabled = controlsDisabled || isMediaCatalogLoading || !linkedAsset;
            const startTitle = isMediaCatalogLoading
              ? 'Wait for the linked media session list to finish loading.'
              : !linkedAsset
              ? 'This custom play cannot start until its linked media session is available again.'
              : 'Start this custom play';

            return (
              <li key={play.id} className="custom-play-item">
                <div className="custom-play-grid">
                  <div className="custom-play-main">
                    <div className="history-row">
                      <div>
                        <strong>{play.name}</strong>
                        <p className="history-time">
                          {play.meditationType} · {play.durationMinutes} min
                        </p>
                      </div>
                      {play.favorite ? <span className="pill ok">favorite</span> : null}
                    </div>

                    {play.recordingLabel ? <p className="section-subtitle">Session note: {play.recordingLabel}</p> : null}
                    <p className="section-subtitle">
                      Sounds: {play.startSound} start · {play.endSound} end
                    </p>
                    {linkedAsset ? (
                      <>
                        <p className="section-subtitle">Media session: {describeLinkedMedia(linkedAsset)}</p>
                        <p className="section-subtitle">Managed path: {linkedAsset.relativePath}</p>
                      </>
                    ) : play.mediaAssetId ? (
                      <p className="section-subtitle">Linked media session unavailable right now.</p>
                    ) : null}
                    {appliedPlayId === play.id ? (
                      <p className="section-subtitle" role="status">
                        Custom play "{play.name}" applied to timer setup.
                      </p>
                    ) : null}
                  </div>

                  <div className="custom-play-side">
                    <div className="custom-play-actions">
                      <button type="button" disabled={startDisabled} title={startTitle} onClick={() => onStartCustomPlay(play.id)}>
                        Start Custom Play
                      </button>
                      <button type="button" className="secondary" disabled={controlsDisabled} onClick={() => onApplyCustomPlay(play.id)}>
                        Apply To Timer
                      </button>
                      <button type="button" className="secondary" disabled={controlsDisabled} onClick={() => onStartEdit(play.id)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        disabled={controlsDisabled}
                        onClick={async () => {
                          onClearFeedback();
                          await onToggleFavorite(play.id);
                        }}
                      >
                        {play.favorite ? 'Unfavorite' : 'Favorite'}
                      </button>
                      <button type="button" className="secondary" disabled={controlsDisabled} onClick={() => onRequestDelete(play.id)}>
                        Delete
                      </button>
                    </div>
                    {activeCustomPlayRun?.customPlayId === play.id ? (
                      <p className="section-subtitle" role="status">
                        Custom play running now.
                      </p>
                    ) : isMediaCatalogLoading ? (
                      <p className="section-subtitle" role="status">
                        Loading linked media session details before this custom play can start.
                      </p>
                    ) : !linkedAsset ? (
                      <p className="section-subtitle" role="status">
                        Start is unavailable until the linked media session is available again.
                      </p>
                    ) : null}
                    {appliedPlayId === play.id ? (
                      <p className="section-subtitle" role="status">
                        Custom play "{play.name}" applied to timer setup.
                      </p>
                    ) : null}
                    {pendingDeleteId === play.id ? (
                      <div className="confirm-sheet" role="dialog" aria-label={`Delete custom play ${play.name} confirmation`}>
                        <p>Delete custom play "{play.name}"?</p>
                        <div className="timer-actions">
                          <button type="button" className="secondary" disabled={controlsDisabled} onClick={onCancelDelete}>
                            Keep Custom Play
                          </button>
                          <button type="button" disabled={controlsDisabled} onClick={() => void onConfirmDelete(play.id)}>
                            Delete Custom Play
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
