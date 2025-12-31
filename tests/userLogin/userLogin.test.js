const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");
const testData = require("./testData");

const TEST_NAME = "User Login Test";

async function userLoginTest() {
  const driver = await createDriver();

  const checks = [];
  let userData = {};
  let responseTime = 0;

  try {
    const start = startTimer();

    await driver.get(`${config.baseUrl}/user/login`);
    checks.push("Login page opened successfully");

    userData = { ...testData.user };

    await driver.findElement(By.name("email")).sendKeys(userData.email);
    await driver.findElement(By.name("password")).sendKeys(userData.password);
    checks.push(`Filled login form with email: ${userData.email}`);

    await driver.wait(until.elementLocated(By.css("button[type='submit']")), 5000);
    const submitButton = await driver.findElement(
      By.css("button[type='submit']")
    );
    await submitButton.click();
    checks.push("Clicked Sign In button");

    await driver.sleep(2000);

    const result = await driver.wait(async () => {
      const errorSelectors = [
        By.css(".notification.is-danger"),
        By.css(".error-message"),
        By.css(".alert-danger"),
        By.css("[class*='error']"),
      ];

      for (const selector of errorSelectors) {
        const errors = await driver.findElements(selector);
        if (errors.length > 0) {
          const text = await errors[0].getText();
          if (text && text.trim()) {
            return { type: "error", message: text.trim() };
          }
        }
      }

      const successSelectors = [
        By.css(".notification.is-success"),
        By.css(".success-message"),
        By.css(".alert-success"),
        By.css("[class*='success']"),
      ];

      for (const selector of successSelectors) {
        const successes = await driver.findElements(selector);
        if (successes.length > 0) {
          const text = await successes[0].getText();
          if (text && text.trim()) {
            return { type: "success", message: text.trim() };
          }
        }
      }

      const currentUrl = await driver.getCurrentUrl();
      if (!currentUrl.includes("/user/login")) {
        if (
          currentUrl.includes("error") ||
          currentUrl.includes("invalid") ||
          currentUrl.includes("403") ||
          currentUrl.includes("404")
        ) {
          return {
            type: "error",
            message: `Redirected to error page: ${currentUrl}`,
          };
        } else {
          return {
            type: "redirect",
            message: `Successfully redirected to: ${currentUrl}`,
          };
        }
      }

      return false;
    }, 15000);

    if (!result) {
      throw new Error(
        "No success message, error message, or redirect detected within timeout"
      );
    }

    if (result.type === "error") {
      throw new Error(`Login failed: ${result.message}`);
    }

    if (result.type === "success") {
      checks.push(`Login success: ${result.message}`);

      const finalUrl = await driver.getCurrentUrl();
      checks.push(`Current URL: ${finalUrl}`);

      if (!finalUrl.includes("/user/login")) {
        checks.push(`URL successfully changed from /user/login`);
      }

      try {
        const logoutSelectors = [
          By.css("a[href*='logout']"),
          By.css("button[onclick*='logout']"),
          By.xpath("//a[contains(text(), 'Logout')]"),
          By.xpath("//a[contains(text(), 'Sign Out')]"),
          By.xpath("//button[contains(text(), 'Logout')]"),
          By.xpath("//button[contains(text(), 'Sign Out')]"),
          By.css(".navbar-item a[href*='logout']"),
          By.css("nav a[href*='logout']"),
        ];

        let logoutFound = false;
        for (const selector of logoutSelectors) {
          const logoutElements = await driver.findElements(selector);
          if (logoutElements.length > 0) {
            const logoutText = await logoutElements[0].getText();
            checks.push(`Logout button found: "${logoutText || "Logout"}"`);
            logoutFound = true;
            break;
          }
        }

        if (!logoutFound) {
          checks.push("Warning: No logout button found in header");
        }
      } catch (error) {
        checks.push("Warning: Could not check for logout button");
      }
    } else if (result.type === "redirect") {
      checks.push(`Login success: ${result.message}`);

      const finalUrl = await driver.getCurrentUrl();
      checks.push(`URL changed from /user/login to: ${finalUrl}`);

      try {
        const logoutSelectors = [
          By.css("a[href*='logout']"),
          By.css("button[onclick*='logout']"),
          By.xpath("//a[contains(text(), 'Logout')]"),
          By.xpath("//a[contains(text(), 'Sign Out')]"),
          By.xpath("//button[contains(text(), 'Logout')]"),
          By.xpath("//button[contains(text(), 'Sign Out')]"),
        ];

        let logoutFound = false;
        for (const selector of logoutSelectors) {
          const logoutElements = await driver.findElements(selector);
          if (logoutElements.length > 0) {
            const logoutText = await logoutElements[0].getText();
            checks.push(`Logout button found: "${logoutText || "Logout"}"`);
            logoutFound = true;
            break;
          }
        }

        if (!logoutFound) {
          checks.push("Warning: No logout button found in header");
        }
      } catch (error) {
        checks.push("Warning: Could not check for logout button");
      }
    }

    responseTime = endTimer(start);

    if (responseTime <= config.performance.maxPageLoadTimeMs) {
      checks.push(
        `Login completed within acceptable time (${responseTime} ms)`
      );
    } else {
      checks.push(
        `Login completed but slower than expected (${responseTime} ms)`
      );
    }

    logTestResult("PASS", TEST_NAME, {
      "Email Used": userData.email,
      "Final URL": await driver.getCurrentUrl(),
      "Response Time": `${responseTime} ms`,
      "Success Message": result.message,
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, "user_login");

    logTestResult("FAIL", TEST_NAME, {
      "Email Used": userData.email || "Not set",
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

module.exports = userLoginTest;
