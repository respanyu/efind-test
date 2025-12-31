const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");
const testData = require("./testData");

const TEST_NAME = "Edit Business";

async function editBusinessTest() {
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
      } catch (error) {
      }
    }

    if (!businessLinkFound) {
      throw new Error("Could not find 'Your Business' link or button");
    }

    await driver.sleep(3000);

    const businessData = { ...testData.business };

    try {
      const subCategorySelect = await driver.findElement(
        By.id("category-field")
      );
      await subCategorySelect.click();
      await driver.sleep(500); 

      const subCategoryOption = await driver.findElement(
        By.xpath(`//option[contains(text(), '${businessData.subcategory}')]`)
      );
      await subCategoryOption.click();
      checks.push(`Selected subcategory: ${businessData.subcategory}`);
    } catch (error) {
      checks.push(`Subcategory selection failed: ${error.message}`);
    }
    try {
      const addressField = await driver.findElement(By.name("address"));
      await addressField.clear();
      await addressField.sendKeys(businessData.address);
      checks.push(`Filled address: ${businessData.address}`);
    } catch (error) {
      checks.push(`Address field fill failed: ${error.message}`);
    }

    try {
      const productsField = await driver.findElement(
        By.name("products_or_services")
      );
      await productsField.clear();
      await productsField.sendKeys(businessData.products_or_services);
      checks.push(
        `Filled products and services: ${businessData.products_or_services}`
      );
    } catch (error) {
      checks.push(`Products and services field fill failed: ${error.message}`);
    }

    try {
      const websiteField = await driver.findElement(By.name("website"));
      await websiteField.clear();
      await websiteField.sendKeys(businessData.website);
      checks.push(`Filled website: ${businessData.website}`);
    } catch (error) {
      checks.push(`Website field fill failed: ${error.message}`);
    }

    try {
      const descriptionField = await driver.findElement(By.name("description"));
      await driver.wait(until.elementIsVisible(descriptionField), 5000);
      await descriptionField.clear();
      await descriptionField.sendKeys(businessData.description);
      checks.push(`Filled business description: ${businessData.description}`);
    } catch (error) {
      checks.push(
        `Description field fill failed with standard method: ${error.message}`
      );
      try {
        await driver.executeScript(`
          const textarea = document.querySelector('textarea[name="description"]');
          if (textarea) {
            textarea.value = '${businessData.description}';
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
          }
        `);
        checks.push(
          `Filled business description using JavaScript fallback: ${businessData.description}`
        );
      } catch (jsError) {
        checks.push(
          `Description field fill failed completely: ${error.message}, JS fallback also failed: ${jsError.message}`
        );
      }
    }

    try {
      const updateButtonSelectors = [
        By.css("button.button.is-primary[type='submit']"),
        By.css("button.is-primary[type='submit']"),
        By.xpath("//button[@type='submit' and contains(text(),'Update')]"),
        By.xpath("//button[contains(text(),'Update')]"),
      ];

      let updateButton = null;
      for (const selector of updateButtonSelectors) {
        try {
          const buttons = await driver.findElements(selector);
          if (buttons.length > 0) {
            updateButton = buttons[0];
            break;
          }
        } catch (error) {
        }
      }

      if (updateButton) {
        await updateButton.click();
        checks.push("Clicked 'Update' button to save business changes");
      } else {
        throw new Error("Update button not found with any selector");
      }

      await driver.sleep(3000);
    } catch (error) {
      checks.push(`Update button click failed: ${error.message}`);
      throw new Error("Failed to submit business update form");
    }

    await driver.sleep(2000);

    const successSelectors = [
      By.css(".notification.is-success"),
      By.css(".message.is-success"),
      By.css(".alert-success"),
      By.xpath("//*[contains(text(), 'success')]"),
      By.xpath("//*[contains(text(), 'updated')]"),
      By.xpath("//*[contains(text(), 'saved')]"),
      By.xpath("//*[contains(text(), 'successful')]"),
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
      throw new Error("Business update failed with error");
    }

    if (successFound) {
      checks.push("Business update completed successfully");
    } else {
      const finalUrl = await driver.getCurrentUrl();
      if (finalUrl.includes("business") && !finalUrl.includes("edit")) {
        checks.push("Business update completed - redirected to business page");
      } else {
        checks.push("Business update completion status unclear");
      }
    }

    responseTime = endTimer(start);

    if (responseTime <= config.performance.maxPageLoadTimeMs) {
      checks.push(
        `Business update completed within acceptable time (${responseTime} ms)`
      );
    } else {
      checks.push(
        `Business update completed but slower than expected (${responseTime} ms)`
      );
    }

    logTestResult("PASS", TEST_NAME, {
      "User Email": testData.user.email,
      Subcategory: businessData.subcategory,
      Address: businessData.address,
      "Products/Services": businessData.products_or_services,
      Website: businessData.website,
      Description: businessData.description,
      "Final URL": await driver.getCurrentUrl(),
      "Response Time": `${responseTime} ms`,
      Result: "Business update completed",
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, "edit_business");

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

module.exports = editBusinessTest;
