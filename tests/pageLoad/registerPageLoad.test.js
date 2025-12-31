const { createDriver } = require("../../config/driver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");
const { By } = require("selenium-webdriver");

const TEST_NAME = "Verify Register Page Loads and Displays Form";
const REGISTER_PATH = "/user/register";

async function testRegisterPageLoad() {
  const driver = await createDriver();
  const checks = [];
  let pageTitle = "";
  let responseTime = 0;

  try {
    const start = startTimer();

    await driver.get(config.baseUrl + REGISTER_PATH);
    checks.push("Register page URL opened");

    pageTitle = await driver.getTitle();
    if (!pageTitle || pageTitle.trim() === "") {
      throw new Error("Register page title is missing");
    }
    checks.push("Register page title is present");

    await driver.findElement(By.name("username"));
    checks.push("Username input field is present");

    await driver.findElement(By.name("email"));
    checks.push("Email input field is present");

    await driver.findElement(By.name("password"));
    checks.push("Password input field is present");

    await driver.findElement(By.name("password_repeat"));
    checks.push("Repeat Password input field is present");

    await driver.findElement(
      By.xpath("//button[contains(text(),'Create Account')]")
    );
    checks.push("Register submit button is present");

    responseTime = endTimer(start);
    checks.push(`Page loaded in ${responseTime} ms`);

    logTestResult("PASS", TEST_NAME, {
      URL: config.baseUrl + REGISTER_PATH,
      "Page Title": pageTitle,
      "Response Time": `${responseTime} ms`,
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, "register_page_load");

    logTestResult("FAIL", TEST_NAME, {
      URL: config.baseUrl + REGISTER_PATH,
      "Page Title": pageTitle || "Not captured",
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

module.exports = testRegisterPageLoad;
