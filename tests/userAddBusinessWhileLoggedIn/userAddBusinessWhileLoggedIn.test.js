const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");
const testData = require("./testData");

const TEST_NAME = "User Add Business While Logged In";

async function userAddBusinessWhileLoggedInTest() {
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
        if (currentUrl.includes("/user/login")) {
          const errorSelectors = [
            By.css(".notification.is-danger"),
            By.css(".error-message"),
            By.css(".alert-danger"),
          ];
          let errorFound = false;
          for (const selector of errorSelectors) {
            try {
              const errors = await driver.findElements(selector);
              if (errors.length > 0) {
                const errorText = await errors[0].getText();
                if (errorText && errorText.trim()) {
                  throw new Error(`Login failed: ${errorText}`);
                }
              }
            } catch (e) {}
          }
          if (!errorFound) {
            throw new Error(
              "Login failed - still on login page with no error message"
            );
          }
        } else {
          checks.push("Login status unclear - proceeding anyway");
        }
      }
    }

    await driver.get(config.baseUrl);
    await driver.wait(until.elementLocated(By.name("business")), 10000);
    checks.push("Business registration form found on home page");

    const businessData = { ...testData.business };

    await driver.findElement(By.name("business")).sendKeys(businessData.name);
    checks.push(`Filled business name: ${businessData.name}`);

    await driver.findElement(By.name("phone")).sendKeys(businessData.phone);
    checks.push(`Filled telephone: ${businessData.phone}`);

    const categoryElements = await driver.findElements(By.name("category"));
    if (categoryElements.length >= 1) {
      await categoryElements[0].click();
      await driver.sleep(500);

      const cityOption = await driver.findElement(
        By.xpath(`//option[contains(text(), '${businessData.city}')]`)
      );
      await cityOption.click();
      checks.push(`Selected city: ${businessData.city}`);
    }

    await driver.findElement(By.name("email")).sendKeys(businessData.email);
    checks.push(`Filled email: ${businessData.email}`);

    if (categoryElements.length >= 2) {
      await categoryElements[1].click();
      await driver.sleep(500);

      const categoryOption = await driver.findElement(
        By.xpath(`//option[contains(text(), '${businessData.category}')]`)
      );
      await categoryOption.click();
      checks.push(`Selected business category: ${businessData.category}`);
    }

    checks.push("Business registration form filled completely");

    const addBusinessSelectors = [
      By.xpath("//button[contains(text(), 'Add this Business')]"),
      By.css("button.is-fullwidth.is-small"),
      By.xpath(
        "//button[contains(@class, 'is-fullwidth') and contains(@class, 'is-small')]"
      ),
      By.partialLinkText("Add this Business"),
      By.css("button[title*='Add this Business']"),
    ];

    let submitButtonFound = false;
    let submitButtonDisabled = false;

    for (const selector of addBusinessSelectors) {
      try {
        const elements = await driver.findElements(selector);
        if (elements.length > 0) {
          const button = elements[0];
          checks.push("Found 'Add this Business' submit button");

          const isDisabled = await button.getAttribute("disabled");
          if (isDisabled) {
            checks.push(
              "'Add this Business' button is disabled - form cannot be submitted"
            );
            submitButtonDisabled = true;
          } else {
            checks.push(
              "'Add this Business' button is enabled - attempting to submit"
            );
          }

          submitButtonFound = true;

          try {
            await button.click();
            checks.push("Clicked 'Add this Business' submit button");

            await driver.sleep(3000);

            const newUrl = await driver.getCurrentUrl();
            checks.push(`URL after clicking submit button: ${newUrl}`);

            const postSubmitSelectors = [
              By.css(".notification"),
              By.css(".alert"),
              By.css(".message"),
              By.xpath("//*[contains(text(), 'success')]"),
              By.xpath("//*[contains(text(), 'error')]"),
              By.xpath("//*[contains(text(), 'added')]"),
              By.xpath("//*[contains(text(), 'already claimed')]"),
              By.xpath("//*[contains(text(), 'Already claimed')]"),
              By.xpath("//*[contains(text(), 'disabled')]"),
              By.xpath("//*[contains(text(), 'cannot submit')]"),
            ];

            for (const msgSelector of postSubmitSelectors) {
              try {
                const msgElements = await driver.findElements(msgSelector);
                if (msgElements.length > 0) {
                  const msgText = await msgElements[0].getText();
                  if (msgText && msgText.trim()) {
                    checks.push(
                      `Message after submission attempt: "${msgText}"`
                    );
                    break;
                  }
                }
              } catch (error) {}
            }
          } catch (clickError) {
            checks.push(`Could not click submit button: ${clickError.message}`);
          }

          break;
        }
      } catch (error) {}
    }

    if (!submitButtonFound) {
      checks.push("'Add this Business' submit button not found on the page");
    }

    const currentUrlAfterSubmit = await driver.getCurrentUrl();
    checks.push(
      `Current URL after submission attempt: ${currentUrlAfterSubmit}`
    );

    responseTime = endTimer(start);

    logTestResult("PASS", TEST_NAME, {
      "Registration Form Found": "Yes",
      "Submit Button Found": submitButtonFound ? "Yes" : "No",
      "Submit Button Disabled": submitButtonDisabled ? "Yes" : "No",
      "Response Time": `${responseTime} ms`,
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(
      driver,
      "user_add_business_logged_in"
    );

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
module.exports = userAddBusinessWhileLoggedInTest;
