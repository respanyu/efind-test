const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");

const TEST_NAME = "Single Category Detail Test";

async function testSingleCategoryDetail() {
  const driver = await createDriver();

  const checks = [];
  let pageTitle = "";
  let categoryName = "";
  let responseTime = 0;

  try {
    const start = startTimer();

    await driver.get(`${config.baseUrl}/categories`);
    checks.push("Categories page opened successfully");

    const container = await driver.wait(
      until.elementLocated(By.css("div.columns.is-multiline")),
      5000
    );
    checks.push("Categories container located");

    const firstCategoryLink = await container.findElement(
      By.css("div.column.is-one-third strong p a")
    );
    categoryName = await firstCategoryLink.getText();
    const categoryUrl = await firstCategoryLink.getAttribute("href");
    checks.push(`Category link found: "${categoryName}"`);

    await firstCategoryLink.click();
    checks.push("Clicked on category link");

    await driver.wait(until.urlIs(categoryUrl), 5000); 
    await driver.wait(until.titleIs(categoryName), 5000).catch(() => {}); 
    checks.push("Category detail page loaded");

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
      "Category Name": categoryName,
      "Response Time": `${responseTime} ms`,
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(
      driver,
      "single_category_details"
    );

    logTestResult("FAIL", TEST_NAME, {
      URL: await driver.getCurrentUrl().catch(() => "Not available"),
      "Page Title": pageTitle || "Not captured",
      "Category Name": categoryName || "Not captured",
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

module.exports = testSingleCategoryDetail;
