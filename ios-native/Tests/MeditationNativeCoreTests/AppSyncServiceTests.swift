import Foundation
import XCTest
@testable import MeditationNativeCore

final class AppSyncServiceTests: XCTestCase {
    override func setUp() {
        super.setUp()
        URLProtocolStub.reset()
    }

    func testQueueReductionReplacesExistingMutationWithoutChangingOrder() {
        let customPlay = SampleData.snapshot.customPlays[0]
        let playlist = SampleData.snapshot.playlists[0]

        var state = AppSyncState(
            connectionState: .pendingSync,
            pendingMutations: [
                .playlistUpsert(playlist, queuedAt: Date(timeIntervalSince1970: 10)),
                .customPlayUpsert(customPlay, queuedAt: Date(timeIntervalSince1970: 20)),
            ]
        )

        var updatedCustomPlay = customPlay
        updatedCustomPlay.name = "Updated custom play"

        state = AppSyncFeature.enqueue(
            .customPlayUpsert(updatedCustomPlay, queuedAt: Date(timeIntervalSince1970: 30)),
            into: state
        )

        XCTAssertEqual(state.pendingMutations.count, 2)
        XCTAssertEqual(state.pendingMutations[0].domain, .playlist)
        XCTAssertEqual(state.pendingMutations[1].payload.customPlay?.name, "Updated custom play")
        XCTAssertEqual(state.pendingMutations[1].queuedAt, Date(timeIntervalSince1970: 30))
    }

    func testReconcilePreservesDeviceOnlyCustomPlayMediaAndSankalpaTitle() {
        let localSnapshot = SampleData.snapshot
        var remoteSnapshot = SampleData.snapshot

        let localCustomPlay = localSnapshot.customPlays[0]
        remoteSnapshot.customPlays[0].media = nil
        remoteSnapshot.customPlays[0].recordingLabel = nil
        remoteSnapshot.customPlays[0].linkedMediaIdentifier = localCustomPlay.linkedMediaIdentifier

        let localSankalpa = localSnapshot.sankalpas[0]
        remoteSnapshot.sankalpas[0].title = ""

        let reconciled = AppSyncFeature.reconcile(
            remoteState: RemoteAppState(snapshot: remoteSnapshot, summary: nil, mediaAssets: []),
            localSnapshot: localSnapshot,
            pendingMutations: []
        )

        XCTAssertEqual(reconciled.customPlays[0].media, localCustomPlay.media)
        XCTAssertEqual(reconciled.customPlays[0].recordingLabel, localCustomPlay.recordingLabel)
        XCTAssertEqual(reconciled.sankalpas[0].title, localSankalpa.title)
    }

    func testFetchRemoteStateMapsBackendContractsIntoNativeModels() async throws {
        URLProtocolStub.handler = { request in
            switch request.url?.path {
            case "/api/settings/timer":
                return URLProtocolStub.jsonResponse(
                    [
                        "id": "default",
                        "timerMode": "fixed",
                        "durationMinutes": 22,
                        "lastFixedDurationMinutes": 22,
                        "meditationType": "Ajapa",
                        "startSound": "Temple Bell",
                        "endSound": "Gong",
                        "intervalEnabled": true,
                        "intervalMinutes": 11,
                        "intervalSound": "Wood Block",
                    ]
                )
            case "/api/session-logs":
                return URLProtocolStub.jsonResponse(
                    [
                        "items": [
                            [
                                "id": UUID().uuidString.lowercased(),
                                "startedAt": "2026-04-09T12:00:00Z",
                                "endedAt": "2026-04-09T12:20:00Z",
                                "meditationType": "Vipassana",
                                "timerMode": "fixed",
                                "intendedDurationSeconds": 1200,
                                "completedDurationSeconds": 1100,
                                "status": "ended early",
                                "source": "auto log",
                                "startSound": "Temple Bell",
                                "endSound": "Temple Bell",
                                "intervalEnabled": false,
                                "intervalMinutes": 0,
                                "intervalSound": "None",
                                "customPlayId": SampleData.snapshot.customPlays[0].id.uuidString.lowercased(),
                                "customPlayName": "Backend Sit",
                                "customPlayRecordingLabel": "Server label",
                                "createdAt": "2026-04-09T12:20:00Z",
                            ],
                        ],
                        "page": 0,
                        "size": 1,
                        "totalItems": 1,
                        "hasNextPage": false,
                    ]
                )
            case "/api/custom-plays":
                return URLProtocolStub.jsonResponse(
                    [
                        [
                            "id": SampleData.snapshot.customPlays[0].id.uuidString.lowercased(),
                            "name": "Backend Sit",
                            "meditationType": "Vipassana",
                            "durationMinutes": 10,
                            "startSound": "Temple Bell",
                            "endSound": "Temple Bell",
                            "mediaAssetId": "media-1",
                            "recordingLabel": "Server label",
                            "favorite": true,
                            "createdAt": "2026-04-09T12:00:00Z",
                            "updatedAt": "2026-04-09T12:10:00Z",
                        ],
                    ]
                )
            case "/api/playlists":
                return URLProtocolStub.jsonResponse([])
            case "/api/sankalpas":
                return URLProtocolStub.jsonResponse(
                    [
                        [
                            "goal": [
                                "id": SampleData.snapshot.sankalpas[0].id.uuidString.lowercased(),
                                "goalType": "duration-based",
                                "targetValue": 120,
                                "days": 7,
                                "meditationType": "Vipassana",
                                "timeOfDayBucket": "morning",
                                "observanceLabel": NSNull(),
                                "observanceRecords": [],
                                "createdAt": "2026-04-08T10:00:00Z",
                                "archived": false,
                            ],
                        ],
                    ]
                )
            case "/api/summaries":
                return URLProtocolStub.jsonResponse(
                    [
                        "overallSummary": [
                            "totalSessionLogs": 3,
                            "completedSessionLogs": 2,
                            "endedEarlySessionLogs": 1,
                            "totalDurationSeconds": 3300,
                            "averageDurationSeconds": 1100,
                            "autoLogs": 2,
                            "manualLogs": 1,
                        ],
                        "byTypeSummary": [
                            [
                                "meditationType": "Vipassana",
                                "sessionLogs": 3,
                                "totalDurationSeconds": 3300,
                            ],
                        ],
                        "bySourceSummary": [
                            [
                                "source": "custom-play",
                                "sessionLogs": 1,
                                "completedSessionLogs": 0,
                                "endedEarlySessionLogs": 1,
                                "totalDurationSeconds": 1100,
                            ],
                        ],
                        "byTimeOfDaySummary": [
                            [
                                "timeOfDayBucket": "morning",
                                "sessionLogs": 3,
                                "completedSessionLogs": 2,
                                "endedEarlySessionLogs": 1,
                                "totalDurationSeconds": 3300,
                            ],
                        ],
                    ]
                )
            case "/api/media/custom-plays":
                return URLProtocolStub.jsonResponse(
                    [
                        [
                            "id": "media-1",
                            "label": "Vipassana Sit 10",
                            "meditationType": "Vipassana",
                            "filePath": "/media/custom-plays/vipassana-sit-10.mp3",
                            "relativePath": "custom-plays/vipassana-sit-10.mp3",
                            "durationSeconds": 600,
                            "mimeType": "audio/mpeg",
                            "sizeBytes": 1024,
                            "updatedAt": "2026-04-09T12:00:00Z",
                        ],
                    ]
                )
            default:
                return URLProtocolStub.jsonResponse([:])
            }
        }

        let client = makeClient()
        let remoteState = try await client.fetchRemoteState(
            localSnapshot: SampleData.snapshot,
            timeZoneIdentifier: "America/Chicago"
        )

        XCTAssertEqual(remoteState.snapshot.timerDraft.mode, .fixedDuration)
        XCTAssertEqual(remoteState.snapshot.timerDraft.durationMinutes, 22)
        XCTAssertEqual(remoteState.snapshot.timerDraft.meditationType, .ajapa)
        XCTAssertEqual(remoteState.snapshot.timerDraft.intervalSoundName, TimerSoundOption.gong.rawValue)
        XCTAssertEqual(remoteState.snapshot.customPlays.first?.linkedMediaIdentifier, "media-1")
        XCTAssertEqual(remoteState.snapshot.customPlays.first?.media?.source, .remote)
        XCTAssertEqual(remoteState.snapshot.customPlays.first?.media?.filePath, "/media/custom-plays/vipassana-sit-10.mp3")
        XCTAssertEqual(remoteState.snapshot.recentSessionLogs.first?.status, .endedEarly)
        XCTAssertEqual(remoteState.snapshot.recentSessionLogs.first?.source, .customPlay)
        XCTAssertEqual(remoteState.snapshot.sankalpas.first?.title, "Vipassana goal")
        XCTAssertFalse(remoteState.snapshot.summary.overallRows.isEmpty)
    }

    func testFetchRemoteStateMapsAutoLogWithoutPlaybackContextToTimerSource() async throws {
        URLProtocolStub.handler = { request in
            switch request.url?.path {
            case "/api/settings/timer":
                return URLProtocolStub.jsonResponse(
                    [
                        "id": "default",
                        "timerMode": "fixed",
                        "durationMinutes": 20,
                        "lastFixedDurationMinutes": 20,
                        "meditationType": "Vipassana",
                        "startSound": "Temple Bell",
                        "endSound": "Temple Bell",
                        "intervalEnabled": false,
                        "intervalMinutes": 0,
                        "intervalSound": "None",
                    ]
                )
            case "/api/session-logs":
                return URLProtocolStub.jsonResponse(
                    [
                        "items": [
                            [
                                "id": UUID().uuidString.lowercased(),
                                "startedAt": "2026-04-09T12:00:00Z",
                                "endedAt": "2026-04-09T12:20:00Z",
                                "meditationType": "Vipassana",
                                "timerMode": "fixed",
                                "intendedDurationSeconds": 1200,
                                "completedDurationSeconds": 1200,
                                "status": "completed",
                                "source": "auto log",
                                "startSound": "None",
                                "endSound": "None",
                                "intervalEnabled": false,
                                "intervalMinutes": 0,
                                "intervalSound": "None",
                                "customPlayId": NSNull(),
                                "customPlayName": NSNull(),
                                "customPlayRecordingLabel": NSNull(),
                                "playlistRunId": NSNull(),
                                "playlistName": NSNull(),
                                "playlistItemPosition": NSNull(),
                                "playlistItemCount": NSNull(),
                            ],
                        ],
                        "page": 0,
                        "size": 1,
                        "totalItems": 1,
                        "hasNextPage": false,
                    ]
                )
            case "/api/custom-plays", "/api/playlists", "/api/sankalpas":
                return URLProtocolStub.jsonResponse([])
            case "/api/summaries":
                return URLProtocolStub.jsonResponse(
                    [
                        "overallSummary": [
                            "totalSessionLogs": 1,
                            "completedSessionLogs": 1,
                            "endedEarlySessionLogs": 0,
                            "totalDurationSeconds": 1200,
                        ],
                        "byTypeSummary": [],
                        "bySourceSummary": [],
                        "byTimeOfDaySummary": [],
                    ]
                )
            case "/api/media/custom-plays":
                return URLProtocolStub.jsonResponse([])
            default:
                return URLProtocolStub.jsonResponse([:])
            }
        }

        let client = makeClient()
        let remoteState = try await client.fetchRemoteState(
            localSnapshot: SampleData.snapshot,
            timeZoneIdentifier: "America/Chicago"
        )

        XCTAssertEqual(remoteState.snapshot.recentSessionLogs.first?.source, .timer)
    }

    func testFetchRemoteStateAcceptsFractionalSecondISO8601Timestamps() async throws {
        URLProtocolStub.handler = { request in
            switch request.url?.path {
            case "/api/settings/timer":
                return URLProtocolStub.jsonResponse(
                    [
                        "id": "default",
                        "timerMode": "fixed",
                        "durationMinutes": 20,
                        "lastFixedDurationMinutes": 20,
                        "meditationType": "Vipassana",
                        "startSound": "Temple Bell",
                        "endSound": "Temple Bell",
                        "intervalEnabled": false,
                        "intervalMinutes": 0,
                        "intervalSound": "None",
                    ]
                )
            case "/api/session-logs":
                return URLProtocolStub.jsonResponse(
                    [
                        "items": [
                            [
                                "id": UUID().uuidString.lowercased(),
                                "startedAt": "2026-04-10T12:12:18.567Z",
                                "endedAt": "2026-04-10T12:46:57.710Z",
                                "meditationType": "Ajapa",
                                "timerMode": "fixed",
                                "intendedDurationSeconds": 300,
                                "completedDurationSeconds": 300,
                                "status": "completed",
                                "source": "auto log",
                                "startSound": "Temple Bell",
                                "endSound": "Temple Bell",
                                "intervalEnabled": false,
                                "intervalMinutes": 5,
                                "intervalSound": "Temple Bell",
                                "customPlayId": NSNull(),
                                "customPlayName": NSNull(),
                                "customPlayRecordingLabel": NSNull(),
                                "playlistRunId": NSNull(),
                                "playlistName": NSNull(),
                                "playlistItemPosition": NSNull(),
                                "playlistItemCount": NSNull(),
                                "createdAt": "2026-04-10T12:46:57.740Z",
                            ],
                        ],
                        "page": 0,
                        "size": 1,
                        "totalItems": 1,
                        "hasNextPage": false,
                    ]
                )
            case "/api/custom-plays", "/api/playlists", "/api/sankalpas":
                return URLProtocolStub.jsonResponse([])
            case "/api/summaries":
                return URLProtocolStub.jsonResponse(
                    [
                        "overallSummary": [
                            "totalSessionLogs": 1,
                            "completedSessionLogs": 1,
                            "endedEarlySessionLogs": 0,
                            "totalDurationSeconds": 300,
                        ],
                        "byTypeSummary": [],
                        "bySourceSummary": [],
                        "byTimeOfDaySummary": [],
                    ]
                )
            case "/api/media/custom-plays":
                return URLProtocolStub.jsonResponse([])
            default:
                return URLProtocolStub.jsonResponse([:])
            }
        }

        let client = makeClient()
        let remoteState = try await client.fetchRemoteState(
            localSnapshot: SampleData.snapshot,
            timeZoneIdentifier: "America/Chicago"
        )

        let remoteLog = try XCTUnwrap(remoteState.snapshot.recentSessionLogs.first)
        XCTAssertEqual(remoteLog.source, .timer)
        XCTAssertEqual(remoteLog.completedDurationSeconds, 300)
    }

    func testFetchRemoteStateAllowsCustomPlayWithoutMediaAssetID() async throws {
        URLProtocolStub.handler = { request in
            switch request.url?.path {
            case "/api/settings/timer":
                return URLProtocolStub.jsonResponse(
                    [
                        "id": "default",
                        "timerMode": "fixed",
                        "durationMinutes": 20,
                        "lastFixedDurationMinutes": 20,
                        "meditationType": "Vipassana",
                        "startSound": "Temple Bell",
                        "endSound": "Temple Bell",
                        "intervalEnabled": false,
                        "intervalMinutes": 5,
                        "intervalSound": "Temple Bell",
                    ]
                )
            case "/api/session-logs":
                return URLProtocolStub.jsonResponse(
                    [
                        "items": [],
                        "page": 0,
                        "size": 0,
                        "totalItems": 0,
                        "hasNextPage": false,
                    ]
                )
            case "/api/custom-plays":
                return URLProtocolStub.jsonResponse(
                    [
                        [
                            "id": "custom-play-legacy-server-id",
                            "name": "Legacy Backend Sit",
                            "meditationType": "Vipassana",
                            "durationMinutes": 65,
                            "startSound": "None",
                            "endSound": "None",
                            "mediaAssetId": NSNull(),
                            "recordingLabel": NSNull(),
                            "favorite": true,
                            "createdAt": "2026-04-09T12:00:00Z",
                            "updatedAt": "2026-04-09T12:10:00Z",
                        ],
                    ]
                )
            case "/api/playlists", "/api/sankalpas":
                return URLProtocolStub.jsonResponse([])
            case "/api/summaries":
                return URLProtocolStub.jsonResponse(
                    [
                        "overallSummary": [
                            "totalSessionLogs": 0,
                            "completedSessionLogs": 0,
                            "endedEarlySessionLogs": 0,
                            "totalDurationSeconds": 0,
                        ],
                        "byTypeSummary": [],
                        "bySourceSummary": [],
                        "byTimeOfDaySummary": [],
                    ]
                )
            case "/api/media/custom-plays":
                return URLProtocolStub.jsonResponse([])
            default:
                return URLProtocolStub.jsonResponse([:])
            }
        }

        let client = makeClient()
        let remoteState = try await client.fetchRemoteState(
            localSnapshot: SampleData.snapshot,
            timeZoneIdentifier: "America/Chicago"
        )

        XCTAssertEqual(remoteState.snapshot.customPlays.count, 1)
        XCTAssertEqual(remoteState.snapshot.customPlays[0].name, "Legacy Backend Sit")
        XCTAssertNil(remoteState.snapshot.customPlays[0].linkedMediaIdentifier)
        XCTAssertNil(remoteState.snapshot.customPlays[0].media)
        XCTAssertEqual(remoteState.snapshot.customPlays[0].durationSeconds, 65 * 60)
    }

    func testApplyMutationSendsQueuedHeaderAndBackendStatusMapping() async throws {
        let sessionLog = SessionLog(
            id: UUID(uuidString: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")!,
            meditationType: .vipassana,
            source: .customPlay,
            status: .endedEarly,
            startedAt: Date(timeIntervalSince1970: 1_700_000_000),
            endedAt: Date(timeIntervalSince1970: 1_700_000_900),
            completedDurationSeconds: 900,
            plannedDurationSeconds: 1200,
            timerMode: .fixedDuration,
            context: SessionLogContext(
                customPlayID: SampleData.snapshot.customPlays[0].id,
                customPlayName: "Client Sit",
                recordingLabel: "Local label"
            )
        )
        let queuedAt = Date(timeIntervalSince1970: 1_700_001_000)

        URLProtocolStub.handler = { request in
            if request.httpMethod == "PUT", request.url?.path == "/api/session-logs/\(sessionLog.id.uuidString.lowercased())" {
                return URLProtocolStub.jsonResponse(
                    [
                        "id": sessionLog.id.uuidString.lowercased(),
                        "startedAt": sessionLog.startedAt.ISO8601Format(),
                        "endedAt": sessionLog.endedAt.ISO8601Format(),
                        "meditationType": "Vipassana",
                        "timerMode": "fixed",
                        "intendedDurationSeconds": 1200,
                        "completedDurationSeconds": 900,
                        "status": "ended early",
                        "source": "custom-play",
                        "startSound": "None",
                        "endSound": "None",
                        "intervalEnabled": false,
                        "intervalMinutes": 0,
                        "intervalSound": "None",
                        "customPlayId": SampleData.snapshot.customPlays[0].id.uuidString.lowercased(),
                        "customPlayName": "Client Sit",
                        "customPlayRecordingLabel": "Local label",
                        "createdAt": sessionLog.endedAt.ISO8601Format(),
                    ]
                )
            }

            switch request.url?.path {
            case "/api/settings/timer":
                return URLProtocolStub.jsonResponse(
                    [
                        "id": "default",
                        "timerMode": "fixed",
                        "durationMinutes": 25,
                        "lastFixedDurationMinutes": 25,
                        "meditationType": "Vipassana",
                        "startSound": "Temple Bell",
                        "endSound": "Temple Bell",
                        "intervalEnabled": false,
                        "intervalMinutes": 0,
                        "intervalSound": "None",
                    ]
                )
            case "/api/session-logs":
                return URLProtocolStub.jsonResponse(
                    [
                        "items": [
                            [
                                "id": sessionLog.id.uuidString.lowercased(),
                                "startedAt": sessionLog.startedAt.ISO8601Format(),
                                "endedAt": sessionLog.endedAt.ISO8601Format(),
                                "meditationType": "Vipassana",
                                "timerMode": "fixed",
                                "intendedDurationSeconds": 1200,
                                "completedDurationSeconds": 900,
                                "status": "ended early",
                                "source": "custom-play",
                                "startSound": "None",
                                "endSound": "None",
                                "intervalEnabled": false,
                                "intervalMinutes": 0,
                                "intervalSound": "None",
                                "customPlayId": SampleData.snapshot.customPlays[0].id.uuidString.lowercased(),
                                "customPlayName": "Client Sit",
                                "customPlayRecordingLabel": "Local label",
                                "createdAt": sessionLog.endedAt.ISO8601Format(),
                            ],
                        ],
                        "page": 0,
                        "size": 1,
                        "totalItems": 1,
                        "hasNextPage": false,
                    ]
                )
            case "/api/custom-plays":
                return URLProtocolStub.jsonResponse([])
            case "/api/playlists":
                return URLProtocolStub.jsonResponse([])
            case "/api/sankalpas":
                return URLProtocolStub.jsonResponse([])
            case "/api/summaries":
                return URLProtocolStub.jsonResponse(
                    [
                        "overallSummary": [
                            "totalSessionLogs": 1,
                            "completedSessionLogs": 0,
                            "endedEarlySessionLogs": 1,
                            "totalDurationSeconds": 900,
                            "averageDurationSeconds": 900,
                            "autoLogs": 1,
                            "manualLogs": 0,
                        ],
                        "byTypeSummary": [],
                        "bySourceSummary": [],
                        "byTimeOfDaySummary": [],
                    ]
                )
            case "/api/media/custom-plays":
                return URLProtocolStub.jsonResponse([])
            default:
                return URLProtocolStub.jsonResponse([:])
            }
        }

        let client = makeClient()
        let mutation = SyncMutation.sessionLogUpsert(sessionLog, queuedAt: queuedAt)
        _ = try await client.applyMutation(
            mutation,
            localSnapshot: SampleData.snapshot,
            timeZoneIdentifier: "America/Chicago"
        )

        let putRequest = try XCTUnwrap(
            URLProtocolStub.requests.first(where: { $0.httpMethod == "PUT" && $0.url?.path.contains("/api/session-logs/") == true })
        )
        XCTAssertEqual(putRequest.value(forHTTPHeaderField: "X-Meditation-Sync-Queued-At"), queuedAt.ISO8601Format())

        let bodyData = try XCTUnwrap(putRequest.httpBodyData)
        let bodyObject = try JSONSerialization.jsonObject(with: bodyData) as? [String: Any]
        XCTAssertEqual(bodyObject?["status"] as? String, "ended early")
        XCTAssertEqual(bodyObject?["source"] as? String, "auto log")
        XCTAssertEqual(bodyObject?["customPlayName"] as? String, "Client Sit")
    }

    func testApplyMutationReturnsNoticeForStaleCustomPlayDelete() async throws {
        let customPlay = SampleData.snapshot.customPlays[0]

        URLProtocolStub.handler = { request in
            switch (request.httpMethod, request.url?.path) {
            case ("DELETE", "/api/custom-plays/\(customPlay.id.uuidString.lowercased())"):
                return URLProtocolStub.jsonResponse(
                    [
                        "outcome": "stale",
                        "currentCustomPlay": [
                            "id": customPlay.id.uuidString.lowercased(),
                            "name": customPlay.name,
                            "meditationType": customPlay.meditationType.rawValue,
                            "durationMinutes": customPlay.durationSeconds / 60,
                            "startSound": customPlay.startSoundName ?? "None",
                            "endSound": customPlay.endSoundName ?? "None",
                            "mediaAssetId": "media-1",
                            "recordingLabel": customPlay.recordingLabel ?? "",
                            "favorite": customPlay.isFavorite,
                        ],
                    ]
                )
            case (_, "/api/settings/timer"):
                return URLProtocolStub.jsonResponse(
                    [
                        "id": "default",
                        "timerMode": "fixed",
                        "durationMinutes": 20,
                        "lastFixedDurationMinutes": 20,
                        "meditationType": "Vipassana",
                        "startSound": "Temple Bell",
                        "endSound": "Temple Bell",
                        "intervalEnabled": false,
                        "intervalMinutes": 0,
                        "intervalSound": "None",
                    ]
                )
            case (_, "/api/session-logs"):
                return URLProtocolStub.jsonResponse(["items": []])
            case (_, "/api/custom-plays"):
                return URLProtocolStub.jsonResponse(
                    [
                        [
                            "id": customPlay.id.uuidString.lowercased(),
                            "name": customPlay.name,
                            "meditationType": customPlay.meditationType.rawValue,
                            "durationMinutes": customPlay.durationSeconds / 60,
                            "startSound": customPlay.startSoundName ?? "None",
                            "endSound": customPlay.endSoundName ?? "None",
                            "mediaAssetId": "media-1",
                            "recordingLabel": customPlay.recordingLabel ?? "",
                            "favorite": customPlay.isFavorite,
                        ],
                    ]
                )
            case (_, "/api/playlists"):
                return URLProtocolStub.jsonResponse([])
            case (_, "/api/sankalpas"):
                return URLProtocolStub.jsonResponse([])
            case (_, "/api/summaries"):
                return URLProtocolStub.jsonResponse(
                    [
                        "overallSummary": [
                            "totalSessionLogs": 0,
                            "completedSessionLogs": 0,
                            "endedEarlySessionLogs": 0,
                            "totalDurationSeconds": 0,
                            "averageDurationSeconds": 0,
                            "autoLogs": 0,
                            "manualLogs": 0,
                        ],
                        "byTypeSummary": [],
                        "bySourceSummary": [],
                        "byTimeOfDaySummary": [],
                    ]
                )
            case (_, "/api/media/custom-plays"):
                return URLProtocolStub.jsonResponse(
                    [
                        [
                            "id": "media-1",
                            "label": "Vipassana Sit 10",
                            "meditationType": customPlay.meditationType.rawValue,
                            "filePath": "/media/custom-plays/vipassana-sit-10.mp3",
                            "relativePath": "custom-plays/vipassana-sit-10.mp3",
                            "durationSeconds": customPlay.durationSeconds,
                            "mimeType": "audio/mpeg",
                            "sizeBytes": 1024,
                            "updatedAt": "2026-04-09T12:00:00Z",
                        ],
                    ]
                )
            default:
                return URLProtocolStub.jsonResponse([:])
            }
        }

        let client = makeClient()
        let remoteState = try await client.applyMutation(
            .customPlayDelete(id: customPlay.id, queuedAt: Date(timeIntervalSince1970: 1_700_001_500)),
            localSnapshot: SampleData.snapshot,
            timeZoneIdentifier: "America/Chicago"
        )

        XCTAssertEqual(
            remoteState.syncNoticeMessage,
            "A newer backend version already exists, so this custom play delete was not applied."
        )
        XCTAssertEqual(remoteState.snapshot.customPlays.first?.id, customPlay.id)
    }

    private func makeClient() -> LiveAppSyncClient {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [URLProtocolStub.self]
        let session = URLSession(configuration: configuration)
        return LiveAppSyncClient(baseURL: URL(string: "http://127.0.0.1:8080")!, session: session)
    }
}

private final class URLProtocolStub: URLProtocol, @unchecked Sendable {
    nonisolated(unsafe) static var handler: ((URLRequest) throws -> (HTTPURLResponse, Data))?
    nonisolated(unsafe) static var requests: [URLRequest] = []

    static func reset() {
        handler = nil
        requests = []
    }

    static func jsonResponse(_ object: Any, statusCode: Int = 200) -> (HTTPURLResponse, Data) {
        let data = try! JSONSerialization.data(withJSONObject: object, options: [])
        let response = HTTPURLResponse(
            url: URL(string: "http://127.0.0.1:8080")!,
            statusCode: statusCode,
            httpVersion: nil,
            headerFields: ["Content-Type": "application/json"]
        )!
        return (response, data)
    }

    override class func canInit(with request: URLRequest) -> Bool {
        true
    }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        request
    }

    override func startLoading() {
        Self.requests.append(request)

        do {
            guard let handler = Self.handler else {
                throw NSError(domain: "URLProtocolStub", code: 0)
            }
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {
    }
}

private extension URLRequest {
    var httpBodyData: Data? {
        if let httpBody {
            return httpBody
        }

        guard let stream = httpBodyStream else {
            return nil
        }

        stream.open()
        defer {
            stream.close()
        }

        let bufferSize = 1_024
        let buffer = UnsafeMutablePointer<UInt8>.allocate(capacity: bufferSize)
        defer {
            buffer.deallocate()
        }

        var data = Data()
        while stream.hasBytesAvailable {
            let readCount = stream.read(buffer, maxLength: bufferSize)
            if readCount <= 0 {
                break
            }
            data.append(buffer, count: readCount)
        }

        return data.isEmpty ? nil : data
    }
}
