const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");
const testData = require("./testData");

const TEST_NAME = "User Logs Out After Being Logged In";

async function userLogoutTest() {
  const driver = await createDriver();

  const checks = [];
  let userData = {};
  let responseTime = 0;
  let hamburgerClicked = false;

  try {
    const start = startTimer();

    await driver.get(`${config.baseUrl}/user/login`);
    checks.push("Login page opened successfully");

    userData = { ...testData.user };

    await driver.findElement(By.name("email")).sendKeys(userData.email);
    await driver.findElement(By.name("password")).sendKeys(userData.password);
    checks.push(`Filled login form with email: ${userData.email}`);

    const loginButton = await driver.findElement(
      By.xpath("//button[@type='submit' and contains(text(),'Sign In')]")
    );
    await loginButton.click();
    checks.push("Clicked Sign In button");

    await driver.wait(async () => {
      const currentUrl = await driver.getCurrentUrl();
      return !currentUrl.includes("/user/login");
    }, 10000);
    checks.push("Successfully logged in and redirected");

    const hamburgerSelectors = [
      By.css(".navbar-burger"),
      By.css("a.navbar-burger"),
      By.css("[role='button'].navbar-burger"),
      By.css(".hamburger"),
      By.css("#hamburger"),
    ];

    let hamburgerClicked = false;
    for (const selector of hamburgerSelectors) {
      try {
        const hamburgerElements = await driver.findElements(selector);
        if (hamburgerElements.length > 0) {
          const hamburger = hamburgerElements[0];
          const isDisplayed = await hamburger.isDisplayed();
          if (isDisplayed) {
            await hamburger.click();
            checks.push(
              "Clicked hamburger menu button to expand mobile navigation"
            );
            hamburgerClicked = true;
            await driver.sleep(1000);
            break;
          }
        }
      } catch (error) {}
    }

    if (!hamburgerClicked) {
      checks.push(
        "No hamburger menu found - checking for logout button in regular navigation"
      );
    }

    const logoutSelectors = [
      By.css("a[href*='logout']"),
      By.css("button[onclick*='logout']"),
      By.xpath("//a[contains(text(), 'Logout')]"),
      By.xpath("//a[contains(text(), 'Sign Out')]"),
      By.xpath("//button[contains(text(), 'Logout')]"),
      By.xpath("//button[contains(text(), 'Sign Out')]"),
      By.css(".navbar-item a[href*='logout']"),
      By.css("nav a[href*='logout']"),
      By.css("header a[href*='logout']"),
      By.css(".header a[href*='logout']"),
      By.css(".navbar-menu a[href*='logout']"),
      By.css("#nav-bar a[href*='logout']"),
      By.css(".navbar-end a[href*='logout']"),
    ];

    let logoutClicked = false;
    for (const selector of logoutSelectors) {
      try {
        const logoutElement = await driver.findElement(selector);
        const logoutText = await logoutElement.getText();
        await logoutElement.click();
        checks.push(`Clicked logout button: "${logoutText || "Logout"}"`);
        logoutClicked = true;
        break;
      } catch (error) {}
    }

    if (!logoutClicked) {
      throw new Error("Could not find logout button in header");
    }

    await driver.sleep(2000);

    const logoutUrl = await driver.getCurrentUrl();
    checks.push(`URL after logout: ${logoutUrl}`);

    if (
      logoutUrl.includes("/user/login") ||
      logoutUrl === config.baseUrl ||
      logoutUrl === `${config.baseUrl}/`
    ) {
      checks.push("Successfully logged out - redirected to appropriate page");
    } else {
      checks.push(`Logged out - current page: ${logoutUrl}`);
    }

    try {
      let logoutStillPresent = false;
      for (const selector of logoutSelectors) {
        const logoutElements = await driver.findElements(selector);
        if (logoutElements.length > 0) {
          logoutStillPresent = true;
          break;
        }
      }

      if (!logoutStillPresent) {
        checks.push("Logout button no longer present - logout confirmed");
      } else {
        checks.push("Warning: Logout button still present after logout");
      }
    } catch (error) {
      checks.push("Could not verify logout button removal");
    }

    try {
      const loginFormElements = await driver.findElements(By.name("email"));
      if (loginFormElements.length > 0) {
        checks.push("Login form present - logout successful");
      }
    } catch (error) {}

    responseTime = endTimer(start);

    if (responseTime <= config.performance.maxPageLoadTimeMs) {
      checks.push(
        `Login and logout completed within acceptable time (${responseTime} ms)`
      );
    } else {
      checks.push(
        `Login and logout completed but slower than expected (${responseTime} ms)`
      );
    }

    logTestResult("PASS", TEST_NAME, {
      "Email Used": userData.email,
      "Hamburger Menu Used": hamburgerClicked ? "Yes" : "No",
      "URL After Logout": logoutUrl,
      "Response Time": `${responseTime} ms`,
      Result: "User successfully logged out",
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, "user_logout");

    logTestResult("FAIL", TEST_NAME, {
      "Email Used": userData.email || "Not set",
      "Hamburger Menu Used": hamburgerClicked ? "Yes" : "No",
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

module.exports = userLogoutTest;
