const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");
const testData = require("./testData");

const TEST_NAME = "Session Persistence";

async function sessionPersistenceTest() {
  const driver = await createDriver();

  const checks = [];
  let responseTime = 0;
  let hamburgerClicked = false;

  try {
    const start = startTimer();

    await driver.get(`${config.baseUrl}/user/login`);
    checks.push("Login page opened successfully");

    await driver.findElement(By.name("email")).sendKeys(testData.user.email);
    checks.push(`Filled email: ${testData.user.email}`);

    await driver
      .findElement(By.name("password"))
      .sendKeys(testData.user.password);
    checks.push("Filled password");

    const loginButton = await driver.findElement(
      By.xpath("//button[@type='submit' and contains(text(),'Sign In')]")
    );
    await loginButton.click();
    checks.push("Clicked Sign In button");

    await driver.sleep(3000);

    const currentUrl = await driver.getCurrentUrl();
    if (
      currentUrl === config.baseUrl ||
      currentUrl.includes("/home") ||
      currentUrl.includes("/dashboard")
    ) {
      checks.push(
        "Login successful in original tab - redirected to home/dashboard"
      );
    } else {
      try {
        await driver.findElement(By.partialLinkText("Logout"));
        checks.push("Login successful in original tab - logout button found");
      } catch (error) {
        checks.push("Login status unclear in original tab");
      }
    }

    const originalWindow = await driver.getWindowHandle();
    checks.push("Stored original window handle");

    await driver.executeScript("window.open('', '_blank');");
    checks.push("Opened new tab");

    const allWindows = await driver.getAllWindowHandles();
    checks.push(`Found ${allWindows.length} window handles`);

    const newWindow = allWindows[allWindows.length - 1];
    await driver.switchTo().window(newWindow);
    checks.push("Switched to new tab");

    await driver.get(config.baseUrl);
    checks.push("Navigated to site in new tab");

    await driver.sleep(2000);

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
              "Clicked hamburger menu button to expand mobile navigation in new tab"
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
        "No hamburger menu found in new tab - checking for logout button in regular navigation"
      );
    }

    const logoutSelectors = [
      By.partialLinkText("Logout"),
      By.partialLinkText("logout"),
      By.css("a[href*='logout']"),
      By.css("a[href*='Logout']"),
      By.xpath("//a[contains(@href, 'logout')]"),
      By.xpath("//a[contains(text(), 'Logout')]"),
      By.xpath("//a[contains(text(), 'logout')]"),
      By.css("button[title*='logout']"),
      By.css("button[title*='Logout']"),
      By.css(".navbar-menu a[href*='logout']"),
      By.css("#nav-bar a[href*='logout']"),
      By.css(".navbar-end a[href*='logout']"),
    ];

    let logoutFound = false;
    for (const selector of logoutSelectors) {
      try {
        const logoutElements = await driver.findElements(selector);
        if (logoutElements.length > 0) {
          const logoutElement = logoutElements[0];
          const isDisplayed = await logoutElement.isDisplayed();
          if (isDisplayed) {
            checks.push("Logout button found and visible in new tab header");
            logoutFound = true;
            break;
          }
        }
      } catch (error) {}
    }

    if (!logoutFound) {
      const newTabUrl = await driver.getCurrentUrl();
      if (newTabUrl.includes("/user/login")) {
        throw new Error(
          "Session did not persist - redirected to login page in new tab"
        );
      } else {
        try {
          await driver.findElement(By.name("email"));
          throw new Error(
            "Session did not persist - login form found in new tab"
          );
        } catch (loginFormError) {
          checks.push(
            "No logout button found, but not on login page - checking page content"
          );
          const debugScreenshot = await takeScreenshot(
            driver,
            "session_persistence_debug"
          );
          checks.push(`Debug screenshot taken: ${debugScreenshot}`);
        }
      }
    }

    const newTabUrl = await driver.getCurrentUrl();
    if (newTabUrl === config.baseUrl || newTabUrl.includes("/home")) {
      checks.push("New tab shows home page - session appears to persist");
    } else {
      checks.push(`New tab URL: ${newTabUrl}`);
    }

    await driver.switchTo().window(originalWindow);
    checks.push("Switched back to original tab");

    try {
      const originalLogoutElements = await driver.findElements(
        By.partialLinkText("Logout")
      );
      if (originalLogoutElements.length > 0) {
        checks.push(
          "Original tab still shows logout button - session maintained"
        );
      } else {
        checks.push(
          "Original tab logout button not found - session may have issues"
        );
      }
    } catch (error) {
      checks.push("Could not verify original tab session status");
    }

    responseTime = endTimer(start);

    if (logoutFound) {
      checks.push(
        "Session persistence test passed - logout button found in new tab"
      );
    } else {
      throw new Error(
        "Session persistence test failed - logout button not found in new tab"
      );
    }

    logTestResult("PASS", TEST_NAME, {
      "User Email": testData.user.email,
      "Hamburger Menu Used": hamburgerClicked ? "Yes" : "No",
      "Original Tab URL": currentUrl,
      "New Tab URL": newTabUrl,
      "Logout Button Found": logoutFound ? "Yes" : "No",
      "Response Time": `${responseTime} ms`,
      Result: "Session persists across tabs",
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, "session_persistence");

    logTestResult("FAIL", TEST_NAME, {
      "User Email": testData.user.email || "Not set",
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

module.exports = sessionPersistenceTest;
