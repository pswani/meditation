import XCTest

final class MeditationNativeUITests: XCTestCase {
    func testLaunchShowsPrimaryDestinations() throws {
        let app = XCUIApplication()
        app.launch()

        XCTAssertTrue(app.tabBars.buttons["Home"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.tabBars.buttons["Practice"].exists)
        XCTAssertTrue(app.tabBars.buttons["History"].exists)
        XCTAssertTrue(app.tabBars.buttons["Goals"].exists)
        XCTAssertTrue(app.tabBars.buttons["Settings"].exists)
    }

    func testPracticeCanStartPauseResumeAndEndFixedTimer() throws {
        let app = XCUIApplication()
        app.launch()

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

        XCTAssertTrue(startButton.waitForExistence(timeout: 2))
    }

    func testPracticeCanRunPauseResumeAndEndFeaturedCustomPlay() throws {
        let app = XCUIApplication()
        app.launch()

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

        XCTAssertTrue(app.buttons["Start featured custom play"].waitForExistence(timeout: 2))
    }

    func testPracticeCanStartAndEndFeaturedPlaylist() throws {
        let app = XCUIApplication()
        app.launch()

        app.tabBars.buttons["Practice"].tap()

        let startButton = app.buttons["Start featured playlist"]
        XCTAssertTrue(startButton.waitForExistence(timeout: 2))
        startButton.tap()

        XCTAssertTrue(app.staticTexts["Active playlist"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Item 1 of 2: Vipassana Warmup"].waitForExistence(timeout: 2))

        let endButton = app.buttons["End playlist"]
        XCTAssertTrue(endButton.waitForExistence(timeout: 2))
        endButton.tap()

        XCTAssertTrue(app.buttons["Start featured playlist"].waitForExistence(timeout: 2))
    }

    func testHistoryAndSettingsExposeMilestoneControls() throws {
        let app = XCUIApplication()
        app.launch()

        app.tabBars.buttons["History"].tap()
        XCTAssertTrue(app.buttons["Manual log"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Vipassana"].exists)

        app.tabBars.buttons["Settings"].tap()
        XCTAssertTrue(app.staticTexts["Timer defaults"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.staticTexts["Notifications"].exists)
    }

    func testGoalsExposeSummaryAndSankalpaActions() throws {
        let app = XCUIApplication()
        app.launch()

        app.tabBars.buttons["Goals"].tap()

        XCTAssertTrue(app.staticTexts["Summary"].waitForExistence(timeout: 2))
        XCTAssertTrue(app.buttons["Create sankalpa"].exists)
        XCTAssertTrue(app.buttons["7d"].exists)

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
}
