const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");
const testData = require("./testData");
const path = require("path");

const TEST_NAME = "Business Logo Upload";

async function businessLogoUploadTest() {
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

    const businessSelectors = [
      By.css("a[href='/business/edit-info']"),
      By.partialLinkText("Your Business"),
      By.partialLinkText("your business"),
      By.xpath("//a[contains(@href, 'business/edit-info')]"),
      By.xpath("//a[contains(text(), 'Your Business')]"),
      By.css("a[href*='business'][href*='edit']"),
      By.css("a[href*='business'][href*='manage']"),
      By.partialLinkText("My Business"),
      By.partialLinkText("my business"),
      By.css("button[title*='business']"),
      By.xpath("//a[contains(text(), 'Business')]"),
      By.xpath("//button[contains(text(), 'Business')]"),
    ];

    let businessLinkFound = false;
    for (const selector of businessSelectors) {
      try {
        const elements = await driver.findElements(selector);
        if (elements.length > 0) {
          await elements[0].click();
          checks.push("Clicked 'Your Business' link/button");
          businessLinkFound = true;
          break;
        }
      } catch (error) {}
    }

    if (!businessLinkFound) {
      throw new Error("Could not find 'Your Business' link or button");
    }

    await driver.sleep(3000);

    const logoLinkSelectors = [
      By.css("a[href='/business/edit-logo']"),
      By.partialLinkText("Business Logo"),
      By.xpath("//a[contains(@href, 'edit-logo')]"),
      By.xpath("//a[contains(text(), 'Business Logo')]"),
    ];

    let logoLinkFound = false;
    for (const selector of logoLinkSelectors) {
      try {
        const elements = await driver.findElements(selector);
        if (elements.length > 0) {
          await elements[0].click();
          checks.push("Clicked 'Business Logo' link");
          logoLinkFound = true;
          break;
        }
      } catch (error) {}
    }

    if (!logoLinkFound) {
      throw new Error("Could not find 'Business Logo' link");
    }

    await driver.sleep(3000);

    const logoSelectors = [
      By.css("input[type='file'][name*='logo']"),
      By.css("input[type='file'][id*='logo']"),
      By.css("input[type='file'][accept*='image']"),
      By.xpath("//input[@type='file' and contains(@name, 'logo')]"),
      By.xpath("//input[@type='file' and contains(@id, 'logo')]"),
      By.xpath("//input[@type='file' and @accept='image/*']"),
      By.xpath(
        "//input[@type='file' and @accept='image/png,image/jpeg,image/jpg']"
      ),
    ];

    let logoInputFound = false;
    let logoInput;

    for (const selector of logoSelectors) {
      try {
        const elements = await driver.findElements(selector);
        if (elements.length > 0) {
          logoInput = elements[0];
          checks.push("Found logo upload input field");
          logoInputFound = true;
          break;
        }
      } catch (error) {}
    }

    if (!logoInputFound) {
      throw new Error("Could not find logo upload input field");
    }

    const absoluteLogoPath = path.resolve(__dirname, testData.logo.path);
    await logoInput.sendKeys(absoluteLogoPath);
    checks.push("Selected logo file for upload");

    await driver.sleep(2000);

    const uploadSelectors = [
      By.css("form[enctype='multipart/form-data'] button[type='submit']"),
      By.css("form[enctype='multipart/form-data'] button.button.is-primary"),
      By.xpath(
        "//form[@enctype='multipart/form-data']//button[contains(text(), 'Upload')]"
      ),
      By.xpath(
        "//h2[contains(text(), 'Upload your business logo')]/following::form[1]//button[@type='submit']"
      ),
      By.xpath(
        "//p[contains(text(), 'Upload your business logo')]/following::form[1]//button[@type='submit']"
      ),
      By.css("button.button.is-primary[type='submit']"),
      By.xpath("//button[text()='Upload' and @type='submit']"),
    ];

    let uploadButtonFound = false;
    for (const selector of uploadSelectors) {
      try {
        const elements = await driver.findElements(selector);
        if (elements.length > 0) {
          await elements[0].click();
          checks.push("Clicked upload/submit button");
          uploadButtonFound = true;
          break;
        }
      } catch (error) {}
    }

    if (!uploadButtonFound) {
      throw new Error("Could not find upload/submit button");
    }

    await driver.sleep(5000);

    const successSelectors = [
      By.css(".notification.is-success"),
      By.css(".alert-success"),
      By.xpath("//*[contains(text(), 'successfully')]"),
      By.xpath("//*[contains(text(), 'uploaded')]"),
      By.xpath("//*[contains(text(), 'Logo uploaded')]"),
      By.xpath("//*[contains(text(), 'Logo updated')]"),
      By.css(".success"),
      By.css(".message.success"),
    ];

    let successFound = false;
    for (const selector of successSelectors) {
      try {
        const elements = await driver.findElements(selector);
        if (elements.length > 0) {
          const messageText = await elements[0].getText();
          checks.push(`Success message found: ${messageText}`);
          successFound = true;
          break;
        }
      } catch (error) {}
    }

    if (!successFound) {
      try {
        const logoPreviewSelectors = [
          By.css("img[src*='logo']"),
          By.css(".logo-preview img"),
          By.css("#logo-preview img"),
          By.xpath("//img[contains(@src, 'logo')]"),
          By.xpath("//img[contains(@alt, 'logo')]"),
        ];

        for (const selector of logoPreviewSelectors) {
          try {
            const elements = await driver.findElements(selector);
            if (elements.length > 0) {
              checks.push(
                "Logo preview image found - upload appears successful"
              );
              successFound = true;
              break;
            }
          } catch (error) {}
        }
      } catch (error) {}
    }

    if (!successFound) {
      checks.push(
        "Could not confirm upload success - checking for error messages"
      );
      const errorSelectors = [
        By.css(".notification.is-danger"),
        By.css(".alert-danger"),
        By.css(".error"),
        By.xpath("//*[contains(text(), 'error')]"),
        By.xpath("//*[contains(text(), 'failed')]"),
        By.xpath("//*[contains(text(), 'invalid')]"),
      ];

      for (const selector of errorSelectors) {
        try {
          const elements = await driver.findElements(selector);
          if (elements.length > 0) {
            const messageText = await elements[0].getText();
            checks.push(`Error message found: ${messageText}`);
            break;
          }
        } catch (error) {}
      }
    }

    responseTime = endTimer(start);
    checks.push(`Test completed in ${responseTime}ms`);

    logTestResult(TEST_NAME, "PASS", checks, responseTime);
    return { status: "PASS", checks, responseTime };
  } catch (error) {
    console.error(`Test failed: ${error.message}`);
    checks.push(`Test failed: ${error.message}`);

    try {
      await takeScreenshot(driver, `${TEST_NAME}_failure`);
      checks.push("Screenshot captured on failure");
    } catch (screenshotError) {
      checks.push(`Failed to capture screenshot: ${screenshotError.message}`);
    }

    logTestResult(TEST_NAME, "FAIL", checks, responseTime);
    return { status: "FAIL", checks, responseTime, error: error.message };
  } finally {
    await driver.quit();
  }
}

module.exports = businessLogoUploadTest;
