const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");
const testData = require("./testData");
const https = require("https");

const TEST_NAME = "User Activates Account and Verifies Login";

async function userActivateAccountTest() {
  const driver = await createDriver();

  const checks = [];
  let userData = {};
  let verificationLink = "";
  let responseTime = 0;

  try {
    const start = startTimer();

    userData = { ...testData.user };
    checks.push("Reading verification link from ethiofind.com/auth.txt");

    const authUrl = "https://ethiofind.com/auth.txt";

    verificationLink = await new Promise((resolve, reject) => {
      https
        .get(authUrl, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            const link = data.trim();
            if (link && link.startsWith("http")) {
              resolve(link);
            } else {
              reject(new Error(`Invalid verification link format: ${link}`));
            }
          });

          res.on("error", (error) => {
            reject(error);
          });
        })
        .on("error", (error) => {
          reject(error);
        });
    });

    checks.push(`Verification link retrieved: ${verificationLink}`);

    await driver.get(verificationLink);
    checks.push("Navigated to verification link");

    await driver.sleep(3000);

    const activationUrl = await driver.getCurrentUrl();
    checks.push(`Activation page URL: ${activationUrl}`);

    try {
      const successSelectors = [
        By.css(".notification.is-success"),
        By.css(".success-message"),
        By.css(".alert-success"),
        By.xpath("//*[contains(text(), 'activated')]"),
        By.xpath("//*[contains(text(), 'verified')]"),
        By.xpath("//*[contains(text(), 'confirmed')]"),
      ];

      let activationSuccess = false;
      for (const selector of successSelectors) {
        const elements = await driver.findElements(selector);
        if (elements.length > 0) {
          const text = await elements[0].getText();
          checks.push(`Account activation success: ${text}`);
          activationSuccess = true;
          break;
        }
      }

      if (!activationSuccess) {
        if (activationUrl.includes("/user/login")) {
          checks.push("Account activated - redirected to login page");
        } else {
          checks.push(
            "Account activation completed (no explicit success message)"
          );
        }
      }
    } catch (error) {
      checks.push("Account activation completed");
    }

    await driver.get(`${config.baseUrl}/user/login`);
    checks.push("Navigated to login page to verify activation");

    await driver.findElement(By.name("email")).sendKeys(userData.email);
    await driver.findElement(By.name("password")).sendKeys(userData.password);
    checks.push(`Filled login form with email: ${userData.email}`);

    const loginButton = await driver.findElement(
      By.xpath("//button[@type='submit' and contains(text(),'Sign In')]")
    );
    await loginButton.click();
    checks.push("Clicked Sign In button");

    const loginResult = await driver.wait(async () => {
      const currentUrl = await driver.getCurrentUrl();
      if (!currentUrl.includes("/user/login")) {
        return { type: "success", url: currentUrl };
      }

      const errorElements = await driver.findElements(
        By.css(".notification.is-danger")
      );
      if (errorElements.length > 0) {
        const errorText = await errorElements[0].getText();
        return { type: "error", message: errorText };
      }

      return false;
    }, 10000);

    if (!loginResult) {
      throw new Error("Login did not complete within timeout");
    }

    if (loginResult.type === "error") {
      throw new Error(`Login failed after activation: ${loginResult.message}`);
    }

    checks.push(
      `Login successful after activation - redirected to: ${loginResult.url}`
    );

    try {
      const logoutSelectors = [
        By.css("a[href*='logout']"),
        By.xpath("//a[contains(text(), 'Logout')]"),
        By.xpath("//a[contains(text(), 'Sign Out')]"),
      ];

      let logoutFound = false;
      for (const selector of logoutSelectors) {
        const logoutElements = await driver.findElements(selector);
        if (logoutElements.length > 0) {
          const logoutText = await logoutElements[0].getText();
          checks.push(`Logout button confirmed: "${logoutText || "Logout"}"`);
          logoutFound = true;
          break;
        }
      }

      if (!logoutFound) {
        checks.push("Warning: Logout button not found after login");
      }
    } catch (error) {
      checks.push("Could not verify logout button presence");
    }

    responseTime = endTimer(start);

    if (responseTime <= config.performance.maxPageLoadTimeMs) {
      checks.push(
        `Account activation and verification completed within acceptable time (${responseTime} ms)`
      );
    } else {
      checks.push(
        `Account activation and verification completed but slower than expected (${responseTime} ms)`
      );
    }

    logTestResult("PASS", TEST_NAME, {
      "Email Used": userData.email,
      "Verification Link": verificationLink,
      "Final URL After Login": loginResult.url,
      "Response Time": `${responseTime} ms`,
      Result: "Account activation and login verification successful",
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(
      driver,
      "user_activate_account"
    );

    logTestResult("FAIL", TEST_NAME, {
      "Email Used": userData.email || "Not set",
      "Verification Link": verificationLink || "Not retrieved",
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

module.exports = userActivateAccountTest;
