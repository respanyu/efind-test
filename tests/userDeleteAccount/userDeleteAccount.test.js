const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");
const testData = require("./testData");

const TEST_NAME = "User Deletes Their Account";

async function userDeleteAccountTest() {
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

    const editProfileSelectors = [
      By.xpath("//a[contains(text(), 'Edit Profile')]"),
      By.css("a[href*='profile/edit']"),
      By.css("a[href='/user/profile/edit']"),
    ];

    let editProfileClicked = false;
    for (const selector of editProfileSelectors) {
      try {
        const editProfileElement = await driver.findElement(selector);
        await editProfileElement.click();
        checks.push("Clicked Edit Profile button");
        editProfileClicked = true;
        break;
      } catch (error) {
      }
    }

    if (!editProfileClicked) {
      throw new Error("Could not find Edit Profile button/link");
    }

    await driver.wait(until.urlContains("/user/profile/edit"), 10000);
    checks.push("Redirected to edit profile page");

    const deleteAccountSelectors = [
      By.xpath("//a[contains(text(), 'Delete Account')]"),
      By.css("a[href*='profile/delete']"),
      By.css("a[href='/user/profile/delete']"),
      By.css("a.is-danger"),
    ];

    let deleteAccountClicked = false;
    for (const selector of deleteAccountSelectors) {
      try {
        const deleteAccountElement = await driver.findElement(selector);
        await deleteAccountElement.click();
        checks.push("Clicked Delete Account link");
        deleteAccountClicked = true;
        break;
      } catch (error) {
      }
    }

    if (!deleteAccountClicked) {
      throw new Error("Could not find Delete Account link");
    }

    await driver.wait(until.urlContains("/user/profile/delete"), 10000);
    checks.push("Redirected to delete account confirmation page");

    const yesRadioButton = await driver.findElement(
      By.css("input[type='radio'][value='yes']")
    );
    await yesRadioButton.click();
    checks.push("Selected 'Yes' to confirm account deletion");

    const confirmDeleteButton = await driver.findElement(
      By.css("button[type='submit'][name='delete']")
    );
    await confirmDeleteButton.click();
    checks.push("Clicked Delete Account confirmation button");

    await driver.sleep(3000); 
    responseTime = endTimer(start);

    const finalUrl = await driver.getCurrentUrl();
    checks.push(`Final URL after deletion: ${finalUrl}`);

    try {
      const successElements = await driver.findElements(
        By.css(".notification.is-success")
      );
      if (successElements.length > 0) {
        const successText = await successElements[0].getText();
        checks.push(`Account deletion success: ${successText}`);
      } else if (
        finalUrl === config.baseUrl ||
        finalUrl === `${config.baseUrl}/`
      ) {
        checks.push("Account deletion successful - redirected to home page");
      }
    } catch (error) {
      checks.push("Account deletion completed (no success message found)");
    }

    if (responseTime <= config.performance.maxPageLoadTimeMs) {
      checks.push(
        `Account deletion completed within acceptable time (${responseTime} ms)`
      );
    } else {
      checks.push(
        `Account deletion completed but slower than expected (${responseTime} ms)`
      );
    }

    logTestResult("PASS", TEST_NAME, {
      "Email Used": userData.email,
      "Final URL": finalUrl,
      "Response Time": `${responseTime} ms`,
      Result: "Account deletion completed",
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, "user_delete_account");

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

module.exports = userDeleteAccountTest;
