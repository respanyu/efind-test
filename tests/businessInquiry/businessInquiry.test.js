const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");
const testData = require("./testData");

const TEST_NAME = "Business Inquiry";

async function businessInquiryTest() {
  const driver = await createDriver();

  const checks = [];
  let responseTime = 0;

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
      checks.push("Login successful - redirected to home/dashboard");
    } else {
      try {
        await driver.findElement(By.partialLinkText("Logout"));
        checks.push("Login successful - logout button found");
      } catch (error) {
        checks.push("Login status unclear");
      }
    }

    if (currentUrl !== config.baseUrl) {
      await driver.get(config.baseUrl);
      checks.push("Navigated to home page");
    }

    const businessLinks = await driver.findElements(
      By.css("a[href*='/business/']")
    );
    if (businessLinks.length > 0) {
      const firstBusinessLink = businessLinks[0];
      const businessHref = await firstBusinessLink.getAttribute("href");
      const businessText = await firstBusinessLink.getText();

      await firstBusinessLink.click();
      checks.push(`Clicked on business: ${businessText || businessHref}`);

      await driver.sleep(3000);

      try {
        await driver.wait(until.elementLocated(By.name("subject")), 10000);
        checks.push("Inquiry form found on business page");

        await driver
          .findElement(By.name("subject"))
          .sendKeys(testData.inquiry.subject);
        checks.push(`Filled subject: ${testData.inquiry.subject}`);

        await driver
          .findElement(By.name("message"))
          .sendKeys(testData.inquiry.message);
        checks.push("Filled inquiry message");

        const subjectField = await driver.findElement(By.name("subject"));
        const inquiryForm = await subjectField.findElement(
          By.xpath("ancestor::form")
        );
        checks.push("Located the inquiry form element");

        const submitButton = await inquiryForm.findElement(
          By.css("button.button.is-link")
        );
        await submitButton.click();
        checks.push("Clicked Submit button on inquiry form");

        await driver.sleep(3000);

        const errorSelectors = [
          By.css(".notification.is-danger"),
          By.css(".notification.is-info"), 
          By.css(".message.is-danger"),
          By.css(".message.is-info"),
          By.css(".alert-danger"),
          By.css(".alert-info"),
          By.css("[class*='error']"),
          By.xpath("//*[contains(text(), 'Invalid email')]"),
          By.xpath("//*[contains(text(), 'error')]"),
          By.xpath("//*[contains(text(), 'invalid')]"),
          By.xpath("//*[contains(text(), 'failed')]"),
          By.xpath("//*[contains(text(), 'required')]"),
          By.xpath("//*[contains(text(), 'Please enter')]"),
          By.xpath("//*[contains(text(), 'must be')]"),
        ];

        let submissionErrorFound = false;
        let submissionErrorText = "";
        for (const selector of errorSelectors) {
          try {
            const errorElements = await driver.findElements(selector);
            if (errorElements.length > 0) {
              const text = await errorElements[0].getText();
              if (text && text.trim() !== "") {
                submissionErrorText = text.trim();
                submissionErrorFound = true;
                checks.push(
                  `Error message found after submission: "${submissionErrorText}"`
                );
                break;
              }
            }
          } catch (error) {
          }
        }

        if (submissionErrorFound) {
          throw new Error(`Inquiry submission failed: ${submissionErrorText}`);
        }
      } catch (error) {
        checks.push(
          `Inquiry form not found or failed to fill: ${error.message}`
        );
        throw new Error("Failed to access or fill inquiry form");
      }
    } else {
      throw new Error("No business links found on home page");
    }

    await driver.sleep(2000);

    const successSelectors = [
      By.css(".notification.is-success"),
      By.css(".message.is-success"),
      By.css(".alert-success"),
      By.xpath("//*[contains(text(), 'success')]"),
      By.xpath("//*[contains(text(), 'sent')]"),
      By.xpath("//*[contains(text(), 'submitted')]"),
      By.xpath("//*[contains(text(), 'thank you')]"),
      By.xpath("//*[contains(text(), 'received')]"),
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
      } catch (error) {
      }
    }

    const errorSelectors = [
      By.css(".notification.is-danger"),
      By.css(".message.is-danger"),
      By.css(".alert-danger"),
      By.css("[class*='error']"),
      By.xpath("//*[contains(text(), 'error')]"),
      By.xpath("//*[contains(text(), 'invalid')]"),
      By.xpath("//*[contains(text(), 'failed')]"),
      By.xpath("//*[contains(text(), 'required')]"),
    ];

    let errorFound = false;
    let errorText = "";
    for (const selector of errorSelectors) {
      try {
        const errorElements = await driver.findElements(selector);
        if (errorElements.length > 0) {
          const text = await errorElements[0].getText();
          if (text && text.trim() !== "") {
            errorText = text;
            errorFound = true;
            break;
          }
        }
      } catch (error) {
      }
    }

    if (errorFound && errorText.trim() !== "") {
      checks.push(`Error message: ${errorText}`);
      throw new Error("Inquiry submission failed with error");
    }

    if (successFound) {
      checks.push("Business inquiry submitted successfully");
    } else {
      const finalUrl = await driver.getCurrentUrl();
      checks.push(`Inquiry submitted - final URL: ${finalUrl}`);
    }

    responseTime = endTimer(start);

    if (responseTime <= config.performance.maxPageLoadTimeMs) {
      checks.push(
        `Business inquiry completed within acceptable time (${responseTime} ms)`
      );
    } else {
      checks.push(
        `Business inquiry completed but slower than expected (${responseTime} ms)`
      );
    }

    logTestResult("PASS", TEST_NAME, {
      "User Email": testData.user.email,
      Subject: testData.inquiry.subject,
      "Message Length": testData.inquiry.message.length,
      "Final URL": await driver.getCurrentUrl(),
      "Response Time": `${responseTime} ms`,
      Result: "Business inquiry submitted",
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, "business_inquiry");

    logTestResult("FAIL", TEST_NAME, {
      "User Email": testData.user.email || "Not set",
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

module.exports = businessInquiryTest;
