import XCTest

final class MeditationNativeUITests: XCTestCase {
    func testLaunchShowsPrimaryDestinations() throws {
        let app = makeApp()

        XCTAssertTrue(app.tabBars.buttons["Home"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.tabBars.buttons["Practice"].exists)
        XCTAssertTrue(app.tabBars.buttons["History"].exists)
        XCTAssertTrue(app.tabBars.buttons["Goals"].exists)
        XCTAssertTrue(app.tabBars.buttons["Settings"].exists)
    }

    func testHomeQuickStartStartsTheTimerFlow() throws {
        let app = makeApp()

        XCTAssertTrue(app.buttons["Start timer"].waitForExistence(timeout: 2))
        app.buttons["Start timer"].tap()

        app.tabBars.buttons["Practice"].tap()
        XCTAssertTrue(app.staticTexts["Active timer"].waitForExistence(timeout: 2))
    }

    func testHomeLastUsedShortcutStartsTheTimerFlow() throws {
        let app = makeApp()

        XCTAssertTrue(app.buttons["Start last used meditation"].waitForExistence(timeout: 2))
        app.buttons["Start last used meditation"].tap()

        app.tabBars.buttons["Practice"].tap()
        XCTAssertTrue(app.staticTexts["Active timer"].waitForExistence(timeout: 2))
    }

    func testHomeFavoriteCustomPlayShortcutStartsTheCustomPlayFlow() throws {
        let app = makeApp()

        XCTAssertTrue(app.buttons["Start Vipassana Sit 20"].waitForExistence(timeout: 2))
        app.buttons["Start Vipassana Sit 20"].tap()

        app.tabBars.buttons["Practice"].tap()
        XCTAssertTrue(app.staticTexts["Active custom play"].waitForExistence(timeout: 2))
    }

    func testHomeFavoritePlaylistShortcutStartsThePlaylistFlow() throws {
        let app = makeApp()

        XCTAssertTrue(app.buttons["Start Morning Discipline"].waitForExistence(timeout: 2))
        app.buttons["Start Morning Discipline"].tap()

        app.tabBars.buttons["Practice"].tap()
        XCTAssertTrue(app.staticTexts["Active playlist"].waitForExistence(timeout: 2))
    }

    func testPracticeCanStartPauseResumeAndEndFixedTimer() throws {
        let app = makeApp()

        app.tabBars.buttons["Practice"].tap()

        let startButton = app.buttons["Start session"]
        XCTAssertTrue(startButton.waitForExistence(timeout: 2))
        startButton.tap()

        let pauseButton = app.buttons["Pause"]
        XCTAssertTrue(pauseButton.waitForExistence(timeout: 2))
        pauseButton.tap()

        let resumeButton = app.buttons["Resume"]
        XCTAssertTrue(resumeButton.waitForExistence(timeout: 2))
        resumeButton.tap()

        let endEarlyButton = app.buttons["End early"]
        XCTAssertTrue(endEarlyButton.waitForExistence(timeout: 2))
        endEarlyButton.tap()

        confirmAlert(in: app, title: "End timer early?", button: "End")

        XCTAssertTrue(startButton.waitForExistence(timeout: 2))
    }

    func testPracticeCancelingEndTimerPromptKeepsSessionRunning() throws {
        let app = makeApp()

        app.tabBars.buttons["Practice"].tap()

        let startButton = app.buttons["Start session"]
        XCTAssertTrue(startButton.waitForExistence(timeout: 2))
        startButton.tap()

        let endEarlyButton = app.buttons["End early"]
        XCTAssertTrue(endEarlyButton.waitForExistence(timeout: 2))
        endEarlyButton.tap()

        let alert = app.alerts["End timer early?"]
        XCTAssertTrue(alert.waitForExistence(timeout: 2))
        alert.buttons["Cancel"].tap()

        XCTAssertTrue(app.staticTexts["Active timer"].waitForExistence(timeout: 2))
        XCTAssertTrue(endEarlyButton.waitForExistence(timeout: 2))
    }

    func testPracticeCanRunPauseResumeAndEndFeaturedCustomPlay() throws {
        let app = makeApp()

        app.tabBars.buttons["Practice"].tap()

        let startButton = app.buttons["Start featured custom play"]
        XCTAssertTrue(startButton.waitForExistence(timeout: 2))
        startButton.tap()

        XCTAssertTrue(app.staticTexts["Active custom play"].waitForExistence(timeout: 2))

        let pauseButton = app.buttons["Pause"]
        XCTAssertTrue(pauseButton.waitForExistence(timeout: 2))
        pauseButton.tap()

        let resumeButton = app.buttons["Resume"]
        XCTAssertTrue(resumeButton.waitForExistence(timeout: 2))
        resumeButton.tap()

        let endButton = app.buttons["End session"]
        XCTAssertTrue(endButton.waitForExistence(timeout: 2))
        endButton.tap()

        confirmAlert(in: app, title: "End custom play?", button: "End")

        XCTAssertTrue(app.buttons["Start featured custom play"].waitForExistence(timeout: 2))
    }

    func testPracticeCanApplyFeaturedCustomPlayToTimerSetup() throws {
        let app = makeApp()

        app.tabBars.buttons["Practice"].tap()

        let applyButton = app.buttons["Apply to timer"]
        XCTAssertTrue(applyButton.waitForExistence(timeout: 2))
        applyButton.tap()

        let startButton = app.buttons["Start session"]
        XCTAssertTrue(startButton.waitForExistence(timeout: 2))
        startButton.tap()

        XCTAssertTrue(app.staticTexts["Active timer"].waitForExistence(timeout: 2))
        let activeTimerValue = app.staticTexts["activeTimerPrimaryText"]
        XCTAssertTrue(activeTimerValue.waitForExistence(timeout: 2))
        XCTAssertTrue(
            activeTimerValue.label.hasPrefix("20:") ||
            activeTimerValue.label.hasPrefix("19:")
        )
    }

    func testPracticeCanStartAndEndFeaturedPlaylist() throws {
        let app = makeApp()

        app.tabBars.buttons["Practice"].tap()

        let startButton = app.buttons["Start featured playlist"]
        XCTAssertTrue(startButton.waitForExistence(timeout: 2))
        startButton.tap()

        XCTAssertTrue(app.staticTexts["Active playlist"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Item 1 of 2: Vipassana Warmup"].waitForExistence(timeout: 2))

        let endButton = app.buttons["End playlist"]
        XCTAssertTrue(endButton.waitForExistence(timeout: 2))
        endButton.tap()

        confirmAlert(in: app, title: "End playlist?", button: "End")

        XCTAssertTrue(app.buttons["Start featured playlist"].waitForExistence(timeout: 2))
    }

    func testPracticeCustomPlayLibrarySupportsDeleteConfirmationFlow() throws {
        let app = makeApp()

        app.tabBars.buttons["Practice"].tap()

        XCTAssertTrue(app.buttons["Open custom play library"].waitForExistence(timeout: 2))
        app.buttons["Open custom play library"].tap()
        XCTAssertTrue(app.navigationBars["Custom plays"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Vipassana Sit 20"].waitForExistence(timeout: 2))

        let customPlayDeleteButton = app.buttons["Delete"].firstMatch
        XCTAssertTrue(customPlayDeleteButton.waitForExistence(timeout: 2))
        customPlayDeleteButton.tap()
        confirmAlert(in: app, title: "Delete custom play?", button: "Delete")
        XCTAssertFalse(app.staticTexts["Vipassana Sit 20"].exists)
    }

    func testPracticeCustomPlayAddOpensCreateForm() throws {
        let app = makeApp()

        app.tabBars.buttons["Practice"].tap()

        XCTAssertTrue(app.buttons["Open custom play library"].waitForExistence(timeout: 2))
        app.buttons["Open custom play library"].tap()
        XCTAssertTrue(app.navigationBars["Custom plays"].waitForExistence(timeout: 2))

        app.buttons["customPlayLibrary.addButton"].tap()

        XCTAssertTrue(app.navigationBars["New custom play"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.buttons["customPlayEditor.createButton"].exists)
        XCTAssertTrue(app.buttons["customPlayEditor.cancelButton"].exists)
        app.buttons["customPlayEditor.cancelButton"].tap()
        XCTAssertTrue(app.navigationBars["Custom plays"].waitForExistence(timeout: 2))
    }

    func testPracticePlaylistLibrarySupportsDeleteConfirmationFlow() throws {
        let app = makeApp()

        app.tabBars.buttons["Practice"].tap()

        XCTAssertTrue(app.buttons["Open playlist library"].waitForExistence(timeout: 2))
        app.buttons["Open playlist library"].tap()
        XCTAssertTrue(app.navigationBars["Playlists"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Morning Discipline"].waitForExistence(timeout: 2))

        let playlistDeleteButton = app.buttons["Delete"].firstMatch
        XCTAssertTrue(playlistDeleteButton.waitForExistence(timeout: 2))
        playlistDeleteButton.tap()
        confirmAlert(in: app, title: "Delete playlist?", button: "Delete")
        XCTAssertFalse(app.staticTexts["Morning Discipline"].exists)
    }

    func testPracticePlaylistAddOpensCreateForm() throws {
        let app = makeApp()

        app.tabBars.buttons["Practice"].tap()

        XCTAssertTrue(app.buttons["Open playlist library"].waitForExistence(timeout: 2))
        app.buttons["Open playlist library"].tap()
        XCTAssertTrue(app.navigationBars["Playlists"].waitForExistence(timeout: 2))

        app.buttons["playlistLibrary.addButton"].tap()

        XCTAssertTrue(app.navigationBars["New playlist"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.buttons["playlistEditor.createButton"].exists)
        XCTAssertTrue(app.buttons["playlistEditor.cancelButton"].exists)
        app.buttons["playlistEditor.cancelButton"].tap()
        XCTAssertTrue(app.navigationBars["Playlists"].waitForExistence(timeout: 2))
    }

    func testHistoryAndSettingsExposeMilestoneControls() throws {
        let app = makeApp()

        app.tabBars.buttons["History"].tap()
        XCTAssertTrue(app.buttons["Manual log"].waitForExistence(timeout: 2))
        app.buttons["Manual log"].tap()
        XCTAssertTrue(app.navigationBars["Manual log"].waitForExistence(timeout: 2))
        app.buttons["Cancel"].tap()
        XCTAssertTrue(app.buttons["Change meditation type"].firstMatch.waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Vipassana"].firstMatch.waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["All statuses"].firstMatch.waitForExistence(timeout: 2))

        app.tabBars.buttons["Settings"].tap()
        XCTAssertTrue(app.staticTexts["Timer defaults"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Notifications"].exists)
    }

    func testGoalsExposeSummaryAndSankalpaActions() throws {
        let app = makeApp()

        app.tabBars.buttons["Goals"].tap()

        XCTAssertTrue(app.staticTexts["Summary"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.buttons["Create sankalpa"].exists)
        XCTAssertTrue(app.buttons["7d"].exists)
        XCTAssertTrue(app.buttons["Custom"].exists)
        XCTAssertTrue(app.staticTexts["By time of day"].waitForExistence(timeout: 2))

        app.buttons["Create sankalpa"].tap()
        XCTAssertTrue(app.navigationBars["Create sankalpa"].waitForExistence(timeout: 2))
        app.buttons["Save"].tap()

        XCTAssertTrue(app.staticTexts["Sankalpa created."].waitForExistence(timeout: 2))

        let archiveButton = app.buttons["Archive"].firstMatch
        XCTAssertTrue(archiveButton.waitForExistence(timeout: 2))
        archiveButton.tap()

        XCTAssertTrue(app.alerts["Archive sankalpa?"].waitForExistence(timeout: 2))
        app.alerts["Archive sankalpa?"].buttons["Archive"].tap()
        XCTAssertTrue(app.staticTexts["Sankalpa archived."].waitForExistence(timeout: 2))

        let restoreButton = app.buttons["Restore"].firstMatch
        XCTAssertTrue(restoreButton.waitForExistence(timeout: 2))
        restoreButton.tap()
        XCTAssertTrue(app.staticTexts["Sankalpa restored."].waitForExistence(timeout: 2))
    }

    private func makeApp() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["MEDITATION_UI_TEST_RESET"] = "1"
        app.launch()
        return app
    }

    private func confirmAlert(in app: XCUIApplication, title: String, button: String) {
        let alert = app.alerts[title]
        XCTAssertTrue(alert.waitForExistence(timeout: 2))
        alert.buttons[button].tap()
    }
}
