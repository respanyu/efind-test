const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");

const TEST_NAME = "Verify Single Business Details Page Loads";

async function testSingleBusinessDetails() {
  const driver = await createDriver();

  const checks = [];
  let pageTitle = "";
  let businessName = "";
  let responseTime = 0;

  try {
    const start = startTimer();

    await driver.get(config.baseUrl);
    checks.push("Home page opened successfully");

    const firstBusinessLink = await driver.wait(
      until.elementLocated(By.css("li.business-name a")),
      5000
    );
    checks.push("First business link located");

    businessName = await firstBusinessLink.getText();
    checks.push(`Business name captured: "${businessName}"`);

    await firstBusinessLink.click();
    checks.push("Clicked on business link");

    await driver.wait(
      until.elementLocated(
        By.css("div.business-details, div.columns.is-multiline")
      ),
      5000
    );
    checks.push("Business details page loaded");

    pageTitle = await driver.getTitle();
    if (!pageTitle || pageTitle.trim() === "") {
      throw new Error("Page title is missing");
    }
    checks.push("Page title is present");

    const currentUrl = await driver.getCurrentUrl();
    checks.push(`Current URL: ${currentUrl}`);

    responseTime = endTimer(start);

    if (responseTime <= config.performance.maxPageLoadTimeMs) {
      checks.push(`Page loaded within acceptable time (${responseTime} ms)`);
    } else {
      checks.push(`Page loaded but slower than expected (${responseTime} ms)`);
    }

    logTestResult("PASS", TEST_NAME, {
      URL: currentUrl,
      "Page Title": pageTitle,
      "Business Name": businessName,
      "Response Time": `${responseTime} ms`,
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(
      driver,
      "single_business_details"
    );

    logTestResult("FAIL", TEST_NAME, {
      URL: await driver.getCurrentUrl().catch(() => "Not available"),
      "Page Title": pageTitle || "Not captured",
      "Business Name": businessName || "Not captured",
      "Response Time": responseTime ? `${responseTime} ms` : "Not measured",
      "Failure Reason": error.message,
      Screenshot: screenshotPath,
      "Checks Completed": checks,
    });

    return { name: TEST_NAME, status: "FAIL" };
  } finally {
    await driver.quit();
  }
}

module.exports = testSingleBusinessDetails;
