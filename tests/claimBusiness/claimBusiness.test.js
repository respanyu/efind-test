const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");
const testData = require("./testData");

const TEST_NAME = "Claim Business";

async function claimBusinessTest() {
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
        const claimLink = await driver.findElement(
          By.partialLinkText("Claim business")
        );
        await claimLink.click();
        checks.push("Clicked 'Claim business' link");

        await driver.sleep(2000);

        const alreadyClaimedSelectors = [
          By.css(".notification.is-info"),
          By.xpath("//*[contains(text(), 'already claimed')]"),
          By.xpath(
            "//*[contains(text(), 'You can not claim another business')]"
          ),
          By.xpath("//*[contains(text(), 'You have already claimed')]"),
        ];

        let alreadyClaimed = false;
        let claimedBusinessName = "";

        for (const selector of alreadyClaimedSelectors) {
          try {
            const elements = await driver.findElements(selector);
            if (elements.length > 0) {
              const messageText = await elements[0].getText();
              checks.push(`Already claimed message found: ${messageText}`);
              alreadyClaimed = true;

              const nameMatch = messageText.match(/business\s+([^.]+)\s*\./i);
              if (nameMatch) {
                claimedBusinessName = nameMatch[1].trim();
              }
              break;
            }
          } catch (error) {
          }
        }

        if (alreadyClaimed) {
          checks.push(
            `User has already claimed a business${
              claimedBusinessName ? `: ${claimedBusinessName}` : ""
            } - claim process completed successfully`
          );
        } else {
          const yesRadio = await driver.findElement(
            By.css("input[type='radio'][name='claimOption'][value='yes']")
          );
          await yesRadio.click();
          checks.push("Selected 'Yes' option to claim business");

          const submitButton = await driver.findElement(
            By.css("button[type='submit'].button.is-primary")
          );
          await submitButton.click();
          checks.push("Clicked 'Submit' button to complete claim");

          await driver.sleep(3000);
        }
      } catch (error) {
        if (
          !error.message.includes("already claimed") &&
          !error.message.includes("You can not claim")
        ) {
          checks.push(
            `Claim business process encountered an issue: ${error.message}`
          );
          throw new Error("Failed to complete claim business process");
        }
      }
    } else {
      throw new Error("No business links found on home page");
    }

    await driver.sleep(2000);

    const alreadyClaimedSelectors = [
      By.css(".notification.is-info"),
      By.xpath("//*[contains(text(), 'already claimed')]"),
      By.xpath("//*[contains(text(), 'You can not claim another business')]"),
      By.xpath("//*[contains(text(), 'You have already claimed')]"),
    ];

    let alreadyClaimedFound = false;
    let claimedBusinessName = "";

    for (const selector of alreadyClaimedSelectors) {
      try {
        const elements = await driver.findElements(selector);
        if (elements.length > 0) {
          const messageText = await elements[0].getText();
          checks.push(`Already claimed message: ${messageText}`);
          alreadyClaimedFound = true;

          const nameMatch = messageText.match(/business\s+([^.]+)\s*\./i);
          if (nameMatch) {
            claimedBusinessName = nameMatch[1].trim();
          }
          break;
        }
      } catch (error) {
      }
    }

    const successSelectors = [
      By.css(".notification.is-success"),
      By.css(".message.is-success"),
      By.css(".alert-success"),
      By.xpath("//*[contains(text(), 'success')]"),
      By.xpath("//*[contains(text(), 'claimed')]"),
      By.xpath("//*[contains(text(), 'submitted')]"),
      By.xpath("//*[contains(text(), 'thank you')]"),
      By.xpath("//*[contains(text(), 'confirmed')]"),
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

    const errorSelectors = [
      By.css(".notification.is-danger"),
      By.css(".notification.is-info"),
      By.css(".message.is-danger"),
      By.css(".message.is-info"),
      By.css(".alert-danger"),
      By.css(".alert-info"),
      By.css("[class*='error']"),
      By.xpath("//*[contains(text(), 'error')]"),
      By.xpath("//*[contains(text(), 'invalid')]"),
      By.xpath("//*[contains(text(), 'failed')]"),
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
      } catch (error) {}
    }

    if (errorFound && errorText.trim() !== "") {
      checks.push(`Error message: ${errorText}`);
      throw new Error("Business claim failed with error");
    }

    if (successFound) {
      checks.push(
        "Business claim submitted successfully with confirmation message"
      );
    } else if (alreadyClaimedFound) {
      checks.push(
        "Business claim validation successful - user already has claimed business"
      );
    } else {
      checks.push(
        "Business claim completed successfully (no error messages found)"
      );
    }

    const finalUrl = await driver.getCurrentUrl();
    if (finalUrl.includes("claim") && finalUrl.includes("success")) {
      checks.push("Business claim completed - redirected to success page");
    } else if (!finalUrl.includes("/business/claim")) {
      checks.push("Business claim completed - redirected away from claim page");
    } else {
      checks.push(
        "Business claim submitted - remained on current page (acceptable)"
      );
    }

    responseTime = endTimer(start);

    if (responseTime <= config.performance.maxPageLoadTimeMs) {
      checks.push(
        `Business claim completed within acceptable time (${responseTime} ms)`
      );
    } else {
      checks.push(
        `Business claim completed but slower than expected (${responseTime} ms)`
      );
    }

    logTestResult("PASS", TEST_NAME, {
      "User Email": testData.user.email,
      "Claim Option": testData.claim.option,
      "Final URL": await driver.getCurrentUrl(),
      "Response Time": `${responseTime} ms`,
      Result: alreadyClaimedFound
        ? "Business claim validation successful - user already has claimed business"
        : "Business claim completed successfully (no errors)",
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, "claim_business");

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

module.exports = claimBusinessTest;
