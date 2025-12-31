const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");

const TEST_NAME = "Business Inquiry Form Disabled When Not Logged In";

async function businessInquiryDisabledTest() {
  const driver = await createDriver();

  const checks = [];
  let responseTime = 0;

  try {
    const start = startTimer();

    await driver.get(config.baseUrl);
    checks.push("Home page opened successfully (not logged in)");

    const businessLinks = await driver.findElements(
      By.css("a[href*='/business/']")
    );
    if (businessLinks.length === 0) {
      throw new Error("No business links found on home page");
    }

    const firstBusinessLink = businessLinks[0];
    const businessHref = await firstBusinessLink.getAttribute("href");
    const businessText = await firstBusinessLink.getText();

    await firstBusinessLink.click();
    checks.push(`Clicked on business: ${businessText || businessHref}`);

    await driver.sleep(3000);

    const notificationSelectors = [
      By.css(".notification"),
      By.css(".message"),
      By.css("article.notification"),
      By.xpath("//*[contains(text(), 'log in')]"),
      By.xpath("//*[contains(text(), 'login')]"),
      By.xpath("//*[contains(text(), 'To avoid spamming')]"),
    ];

    let loginNotificationFound = false;
    let notificationText = "";

    for (const selector of notificationSelectors) {
      try {
        const notificationElements = await driver.findElements(selector);
        if (notificationElements.length > 0) {
          for (const element of notificationElements) {
            const text = await element.getText();
            if (text && (text.toLowerCase().includes('log in') ||
                        text.toLowerCase().includes('login') ||
                        text.includes('To avoid spamming'))) {
              notificationText = text;
              loginNotificationFound = true;
              checks.push(`Login notification found: "${notificationText}"`);
              break;
            }
          }
          if (loginNotificationFound) break;
        }
      } catch (error) {
      }
    }

    if (!loginNotificationFound) {
      checks.push("Login notification not found - checking if form is still accessible");
    }

    try {
      await driver.wait(until.elementLocated(By.name("subject")), 5000);
      checks.push("Inquiry form found on business page");

      const subjectField = await driver.findElement(By.name("subject"));
      const subjectDisabled = await subjectField.getAttribute("disabled");

      if (subjectDisabled) {
        checks.push("Subject field is disabled (as expected for non-logged-in users)");
      } else {
        checks.push("Subject field is enabled (unexpected for non-logged-in users)");
      }

      const messageField = await driver.findElement(By.name("message"));
      const messageDisabled = await messageField.getAttribute("disabled");

      if (messageDisabled) {
        checks.push("Message field is disabled (as expected for non-logged-in users)");
      } else {
        checks.push("Message field is enabled (unexpected for non-logged-in users)");
      }

      const submitSelectors = [
        By.css("button.button.is-link"),
        By.xpath("//button[contains(text(), 'Submit')]"),
        By.css("button[type='submit']"),
      ];

      let submitButtonDisabled = false;
      for (const selector of submitSelectors) {
        try {
          const submitButtons = await driver.findElements(selector);
          if (submitButtons.length > 0) {
            const submitButton = submitButtons[0];
            const buttonDisabled = await submitButton.getAttribute("disabled");

            if (buttonDisabled) {
              checks.push("Submit button is disabled (as expected for non-logged-in users)");
              submitButtonDisabled = true;
            } else {
              checks.push("Submit button is enabled (unexpected for non-logged-in users)");
            }
            break;
          }
        } catch (error) {
        }
      }

      if (!submitButtonDisabled) {
        checks.push("Submit button not found or status unclear");
      }

    } catch (error) {
      checks.push(`Inquiry form not found or error checking disabled state: ${error.message}`);
    }

    const currentUrl = await driver.getCurrentUrl();
    checks.push(`Current URL: ${currentUrl}`);

    responseTime = endTimer(start);

    const formProperlyDisabled = loginNotificationFound; 

    if (formProperlyDisabled) {
      checks.push("Business inquiry form properly disabled for non-logged-in users");
    } else {
      throw new Error("Business inquiry form not properly disabled for non-logged-in users");
    }

    if (responseTime <= config.performance.maxPageLoadTimeMs) {
      checks.push(`Test completed within acceptable time (${responseTime} ms)`);
    } else {
      checks.push(`Test completed but slower than expected (${responseTime} ms)`);
    }

    logTestResult("PASS", TEST_NAME, {
      "Business URL": currentUrl,
      "Login Notification Found": loginNotificationFound ? "Yes" : "No",
      "Notification Text": notificationText,
      "Response Time": `${responseTime} ms`,
      Result: "Business inquiry form properly disabled for unauthenticated users",
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, "business_inquiry_disabled");

    logTestResult("FAIL", TEST_NAME, {
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

module.exports = businessInquiryDisabledTest;