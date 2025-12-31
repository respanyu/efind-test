const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");
const testData = require("./testData");

const TEST_NAME = "User Requests Password Reset";

async function userPasswordResetTest() {
  const driver = await createDriver();

  const checks = [];
  let userData = {};
  let responseTime = 0;
  let urlBeforeSubmit = "N/A";
  let urlAfterSubmit = "N/A";

  try {
    const start = startTimer();

    await driver.get(`${config.baseUrl}/user/login`);
    checks.push("Login page opened successfully");

    const resetLinkSelectors = [
      By.xpath("//a[contains(text(), 'Reset Here')]"),
      By.xpath("//a[contains(text(), 'Forgot password')]"),
      By.xpath("//a[contains(text(), 'reset')]"),
      By.css("a[href*='password']"),
      By.css("a[href*='reset']"),
      By.css("a[href*='forgot']"),
    ];

    let resetLinkClicked = false;
    for (const selector of resetLinkSelectors) {
      try {
        const resetLink = await driver.findElement(selector);
        const linkText = await resetLink.getText();
        await resetLink.click();
        checks.push(`Clicked reset link: "${linkText}"`);
        resetLinkClicked = true;
        break;
      } catch (error) {}
    }

    if (!resetLinkClicked) {
      throw new Error("Could not find password reset link on login page");
    }

    await driver.wait(until.urlContains("password"), 10000);
    checks.push("Redirected to password reset page");

    userData = { ...testData.user };

    await driver.findElement(By.name("email")).sendKeys(userData.email);
    checks.push(`Filled email field with: ${userData.email}`);

    const urlBeforeSubmit = await driver.getCurrentUrl();
    checks.push(`URL before reset form submission: ${urlBeforeSubmit}`);

    const resetButtonSelectors = [
      By.xpath("//button[contains(text(), 'Reset Password')]"),
      By.css("button[type='submit']"),
      By.css("button.is-primary"),
    ];

    let resetButtonClicked = false;
    for (const selector of resetButtonSelectors) {
      try {
        const resetButton = await driver.findElement(selector);
        const buttonText = await resetButton.getText();
        await resetButton.click();
        checks.push(`Clicked reset button: "${buttonText}"`);
        resetButtonClicked = true;
        break;
      } catch (error) {}
    }

    if (!resetButtonClicked) {
      throw new Error("Could not find reset password button");
    }

    await driver.sleep(3000);

    const urlAfterSubmit = await driver.getCurrentUrl();
    checks.push(`URL after reset form submission: ${urlAfterSubmit}`);

    if (urlAfterSubmit !== urlBeforeSubmit) {
      checks.push(
        "URL changed after reset form submission - redirect successful"
      );
    } else {
      checks.push("URL remained the same after reset form submission");
    }

    const errorSelectors = [
      By.css(".notification.is-danger"),
      By.css(".message.is-danger"),
      By.css(".alert-danger"),
      By.css("[class*='error']"),
      By.xpath("//*[contains(text(), 'Invalid email')]"),
      By.xpath("//*[contains(text(), 'does not exist')]"),
    ];

    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        const errorElements = await driver.findElements(selector);
        if (errorElements.length > 0) {
          const errorText = await errorElements[0].getText();
          checks.push(`Error found: ${errorText}`);
          errorFound = true;
          break;
        }
      } catch (error) {}
    }

    if (errorFound) {
      throw new Error("Password reset failed with error message");
    }

    const successSelectors = [
      By.css(".notification.is-success"),
      By.css(".message.is-success"),
      By.css(".alert-success"),
      By.xpath("//*[contains(text(), 'sent')]"),
      By.xpath("//*[contains(text(), 'check your email')]"),
      By.xpath("//*[contains(text(), 'reset link')]"),
    ];

    let successFound = false;
    for (const selector of successSelectors) {
      try {
        const successElements = await driver.findElements(selector);
        if (successElements.length > 0) {
          const successText = await successElements[0].getText();
          checks.push(`Success message: ${successText}`);
          successFound = true;
          break;
        }
      } catch (error) {}
    }

    if (successFound) {
      checks.push("Password reset request completed successfully");
    } else {
      const currentUrl = await driver.getCurrentUrl();
      if (currentUrl.includes("password") || currentUrl.includes("reset")) {
        checks.push("Password reset request submitted (no error occurred)");
      } else {
        checks.push("Password reset request completed - redirected");
      }
    }

    responseTime = endTimer(start);

    if (responseTime <= config.performance.maxPageLoadTimeMs) {
      checks.push(
        `Password reset request completed within acceptable time (${responseTime} ms)`
      );
    } else {
      checks.push(
        `Password reset request completed but slower than expected (${responseTime} ms)`
      );
    }

    logTestResult("PASS", TEST_NAME, {
      "Email Used": userData.email,
      "URL Before Submit": urlBeforeSubmit,
      "URL After Submit": urlAfterSubmit,
      "URL Changed": urlAfterSubmit !== urlBeforeSubmit ? "Yes" : "No",
      "Final URL": await driver.getCurrentUrl(),
      "Response Time": `${responseTime} ms`,
      Result: "Password reset request submitted without errors",
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, "user_password_reset");

    logTestResult("FAIL", TEST_NAME, {
      "Email Used": userData.email || "Not set",
      "URL Before Submit": urlBeforeSubmit || "Not captured",
      "URL After Submit": urlAfterSubmit || "Not captured",
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

module.exports = userPasswordResetTest;
