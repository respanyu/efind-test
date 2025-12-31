const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");
const testData = require("./testData");

const TEST_NAME = "User Registers a New Account Successfully";

async function userRegisterTest() {
  const driver = await createDriver();
  const checks = [];

  let responseTime = 0;
  let emailUsed = "N/A";
  let urlBeforeSubmit = "N/A";
  let urlAfterSubmit = "N/A";

  try {
    const start = startTimer();

    await driver.get(`${config.baseUrl}/user/register`);
    await driver.wait(until.elementLocated(By.name("username")), 10000);
    checks.push("Register page loaded");

    emailUsed = testData.user.email;
    const user = {
      ...testData.user,
      email: emailUsed,
    };

    await driver.findElement(By.name("username")).sendKeys(user.username);
    await driver.findElement(By.name("email")).sendKeys(user.email);
    await driver.findElement(By.name("password")).sendKeys(user.password);
    await driver
      .findElement(By.name("password_repeat"))
      .sendKeys(user.password_repeat);

    checks.push(`Filled registration form with email: ${user.email}`);

    const submitButton = await driver.findElement(
      By.xpath("//button[@type='submit' and contains(text(),'Create Account')]")
    );

    const urlBeforeSubmit = await driver.getCurrentUrl();
    checks.push(`URL before form submission: ${urlBeforeSubmit}`);

    await submitButton.click();
    checks.push("Clicked Create Account button");

    await driver.sleep(2000);

    const urlAfterSubmit = await driver.getCurrentUrl();
    checks.push(`URL after form submission: ${urlAfterSubmit}`);

    if (urlAfterSubmit !== urlBeforeSubmit) {
      checks.push("URL changed after form submission - redirect successful");
    } else {
      checks.push("URL remained the same after form submission");
    }

    const message = await driver.wait(async () => {
      const error = await driver.findElements(
        By.css(".notification.is-danger")
      );
      if (error.length > 0) {
        return { type: "error", element: error[0] };
      }

      const success = await driver.findElements(
        By.css(".notification.is-success")
      );
      if (success.length > 0) {
        return { type: "success", element: success[0] };
      }

      return false;
    }, 10000);

    const messageText = (await message.element.getText()).trim();

    if (message.type === "error") {
      checks.push(`Backend validation error received`);
      throw new Error(messageText);
    }

    checks.push(`Registration successful: "${messageText}"`);

    responseTime = endTimer(start);

    checks.push(`Response time: ${responseTime} ms`);

    logTestResult("PASS", TEST_NAME, {
      "Email Used": emailUsed,
      "URL Before Submit": urlBeforeSubmit,
      "URL After Submit": urlAfterSubmit,
      "URL Changed": urlAfterSubmit !== urlBeforeSubmit ? "Yes" : "No",
      "Response Time": `${responseTime} ms`,
      "Success Message": messageText,
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, "user_register");

    logTestResult("FAIL", TEST_NAME, {
      "Email Used": emailUsed,
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

module.exports = userRegisterTest;
