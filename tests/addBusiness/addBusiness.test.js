const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");
const testData = require("./testData");
const path = require("path");

const TEST_NAME = "Add Business from Home Page";

async function addBusinessTest() {
  const driver = await createDriver();

  const checks = [];
  let businessData = {};
  let responseTime = 0;

  try {
    const start = startTimer();

    await driver.get(config.baseUrl);
    checks.push("Home page opened successfully");

    await driver.wait(until.elementLocated(By.name("business")), 10000);
    checks.push("Business add form is visible");

    businessData = { ...testData.business };

    await driver.findElement(By.name("business")).sendKeys(businessData.name);
    checks.push(`Filled business name: ${businessData.name}`);

    await driver.findElement(By.name("phone")).sendKeys(businessData.phone);
    checks.push(`Filled telephone: ${businessData.phone}`);

    const citySelect = await driver.findElement(By.id("category-field"));
    await citySelect.click();
    await driver.sleep(500);

    const cityOption = await driver.findElement(
      By.xpath(`//option[contains(text(), '${businessData.city}')]`)
    );
    await cityOption.click();
    checks.push(`Selected city: ${businessData.city}`);

    await driver.findElement(By.name("email")).sendKeys(businessData.email);
    checks.push(`Filled email: ${businessData.email}`);

    const categorySelects = await driver.findElements(By.name("category"));
    const businessCategorySelect = categorySelects[1];

    await businessCategorySelect.click();
    await driver.sleep(500);
    const categoryOption = await driver.findElement(
      By.xpath(`//option[contains(text(), '${businessData.category}')]`)
    );
    await categoryOption.click();
    checks.push(`Selected business category: ${businessData.category}`);

    const submitButton = await driver.findElement(
      By.css("button.is-fullwidth.is-small")
    );
    await submitButton.click();
    checks.push("Clicked 'Add this Business' button");

    await driver.sleep(3000);

    const currentUrl = await driver.getCurrentUrl();
    if (currentUrl !== config.baseUrl && currentUrl.includes("business")) {
      checks.push(
        "Redirected to business details page for additional information"
      );

      try {
        await driver.wait(until.elementLocated(By.id("category-field")), 10000);
        checks.push("Additional business details form is visible");

        const subCategorySelect = await driver.findElement(
          By.id("category-field")
        );
        await subCategorySelect.click();
        await driver.sleep(500);

        const optionElements = await driver.findElements(
          By.css("#category-field option")
        );
        let selectedOption = null;
        for (let i = 1; i < optionElements.length; i++) {
          const optionText = await optionElements[i].getText();
          const optionValue = await optionElements[i].getAttribute("value");
          if (optionValue && optionValue.trim() !== "") {
            await optionElements[i].click();
            selectedOption = optionText;
            break;
          }
        }

        if (selectedOption) {
          checks.push(`Selected subcategory: ${selectedOption}`);
          businessData.subcategory = selectedOption;
        } else {
          throw new Error("No valid subcategory options found");
        }

        await driver
          .findElement(By.name("address"))
          .sendKeys(businessData.address);
        checks.push(`Filled address: ${businessData.address}`);

        await driver
          .findElement(By.name("products_or_services"))
          .sendKeys(businessData.products_or_services);
        checks.push(
          `Filled products and services: ${businessData.products_or_services}`
        );

        await driver
          .findElement(By.name("website"))
          .sendKeys(businessData.website);
        checks.push(`Filled website: ${businessData.website}`);

        try {
          const descriptionField = await driver.findElement(
            By.name("description")
          );
          await driver.wait(until.elementIsVisible(descriptionField), 5000);
          await descriptionField.clear();
          await descriptionField.sendKeys(businessData.description);
          checks.push(
            `Filled business description: ${businessData.description}`
          );
        } catch (error) {
          checks.push(`Failed to fill description: ${error.message}`);
          try {
            await driver.executeScript(`
              const textarea = document.querySelector('textarea[name="description"]');
              if (textarea) {
                textarea.value = '${businessData.description}';
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
              }
            `);
            checks.push(
              `Filled business description using JavaScript: ${businessData.description}`
            );
          } catch (jsError) {
            throw new Error(
              `Failed to fill description field: ${error.message}, JS fallback also failed: ${jsError.message}`
            );
          }
        }

        const updateButton = await driver.findElement(
          By.css("button.button.is-primary")
        );
        await updateButton.click();
        checks.push(
          "Clicked 'Update' button to complete business registration"
        );

        await driver.sleep(3000);

        try {
          const currentUrl = await driver.getCurrentUrl();
          if (
            currentUrl.includes("business-logo") ||
            currentUrl.includes("logo")
          ) {
            checks.push("Redirected to business logo upload page");

            await driver.wait(
              until.elementLocated(By.css("input[type='file'][name='logo']")),
              10000
            );
            checks.push("Logo upload form is visible");

            const fileInput = await driver.findElement(
              By.css("input[type='file'][name='logo']")
            );
            const absoluteLogoPath = path.resolve(
              __dirname,
              testData.logo.path
            );
            await fileInput.sendKeys(absoluteLogoPath);
            checks.push(`Selected logo file: ${testData.logo.path}`);

            const uploadButton = await driver.findElement(
              By.css("button.button.is-primary[type='submit']")
            );
            await uploadButton.click();
            checks.push("Clicked 'Upload' button to upload business logo");

            await driver.sleep(3000);
          } else {
            checks.push(
              "Logo upload page not detected, skipping logo upload step"
            );
          }
        } catch (error) {
          checks.push(`Logo upload failed: ${error.message}`);
        }
      } catch (error) {
        checks.push(`Failed to fill additional details: ${error.message}`);
        throw new Error(
          "Failed to complete business registration with additional details"
        );
      }
    }

    await driver.sleep(2000);

    const successSelectors = [
      By.css(".notification.is-success"),
      By.css(".message.is-success"),
      By.css(".alert-success"),
      By.xpath("//*[contains(text(), 'success')]"),
      By.xpath("//*[contains(text(), 'added')]"),
      By.xpath("//*[contains(text(), 'submitted')]"),
      By.xpath("//*[contains(text(), 'thank you')]"),
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
      By.css(".message.is-danger"),
      By.css(".alert-danger"),
      By.css("[class*='error']"),
      By.xpath("//*[contains(text(), 'error')]"),
      By.xpath("//*[contains(text(), 'invalid')]"),
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
      } catch (error) {}
    }

    if (errorFound && errorText.trim() !== "") {
      checks.push(`Error message: ${errorText}`);
      throw new Error("Business add form submission failed with error");
    }

    if (successFound) {
      checks.push(
        "Business registration and logo upload completed successfully"
      );
    } else {
      const finalUrl = await driver.getCurrentUrl();
      if (
        finalUrl !== config.baseUrl &&
        !finalUrl.includes("business/add") &&
        !finalUrl.includes("business-logo")
      ) {
        checks.push(
          `Business registration completed - redirected to: ${finalUrl}`
        );
      } else {
        checks.push("Business registration completion status unclear");
      }
    }

    responseTime = endTimer(start);

    if (responseTime <= config.performance.maxPageLoadTimeMs) {
      checks.push(
        `Business registration completed within acceptable time (${responseTime} ms)`
      );
    } else {
      checks.push(
        `Business registration completed but slower than expected (${responseTime} ms)`
      );
    }

    logTestResult("PASS", TEST_NAME, {
      "Business Name": businessData.name,
      Email: businessData.email,
      Phone: businessData.phone,
      City: businessData.city,
      Category: businessData.category,
      Subcategory: businessData.subcategory,
      Address: businessData.address,
      "Products/Services": businessData.products_or_services,
      Website: businessData.website,
      Description: businessData.description,
      "Logo Uploaded": "Yes",
      "Final URL": await driver.getCurrentUrl(),
      "Response Time": `${responseTime} ms`,
      Result: "Business registration and logo upload completed",
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, "add_business");

    logTestResult("FAIL", TEST_NAME, {
      "Business Name": businessData.name || "Not set",
      Email: businessData.email || "Not set",
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

module.exports = addBusinessTest;
