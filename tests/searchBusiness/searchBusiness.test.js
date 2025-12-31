const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");
const testData = require("./testData");

const TEST_NAME = "Search Business Test";

async function performSearch(driver, keyword, city, scenario, keywordRequired) {
  const checks = [];
  let responseTime = 0;

  try {
    const start = startTimer();

    const keywordField = await driver.findElement(By.name("keyword"));
    await keywordField.clear();
    if (keyword) {
      await keywordField.sendKeys(keyword);
      checks.push(`Entered keyword: ${keyword}`);
    } else {
      checks.push("Keyword field left empty");
    }

    const cityField = await driver.findElement(By.name("city"));
    await cityField.clear();
    if (city) {
      await cityField.sendKeys(city);
      checks.push(`Entered city: ${city}`);
    } else {
      checks.push("City field left empty");
    }

    const findButton = await driver.findElement(By.css("button.find-button"));
    await findButton.click();
    checks.push("Clicked Find button");

    try {
      await driver.wait(until.urlContains("/search"), 5000);
      checks.push("Navigated to search results page");
      const currentUrl = await driver.getCurrentUrl();
      checks.push(`Search URL: ${currentUrl}`);
    } catch (e) {
      const errorSelectors = [
        By.css(".notification.is-danger"),
        By.css(".error-message"),
        By.css(".alert-danger"),
        By.css("[class*='error']"),
        By.css("input:invalid"),
      ];

      let hasError = false;
      for (const selector of errorSelectors) {
        const errors = await driver.findElements(selector);
        if (errors.length > 0) {
          const text = await errors[0].getText();
          if (text && text.trim()) {
            checks.push(`Validation error: ${text}`);
            hasError = true;
            break;
          }
        }
      }

      if (!hasError) {
        if (keywordRequired && !keyword) {
          checks.push(
            "Expected: No navigation since keyword is required and empty"
          );
        } else {
          checks.push(
            "Form submission failed - no navigation or error message"
          );
        }
      }
    }

    responseTime = endTimer(start);

    let expectedSuccess = true;
    if (keywordRequired && !keyword) {
      expectedSuccess = false;
    }

    const actualSuccess = checks.some((check) =>
      check.includes("Navigated to search results page")
    );

    return {
      scenario,
      status: expectedSuccess === actualSuccess ? "PASS" : "FAIL",
      responseTime,
      checks,
      expectedSuccess,
      actualSuccess,
    };
  } catch (error) {
    responseTime = endTimer(start);
    return {
      scenario,
      status: "FAIL",
      responseTime,
      error: error.message,
      checks,
    };
  }
}

async function searchBusinessTest() {
  const driver = await createDriver();

  const results = [];
  let fieldRequirements = {};

  try {
    await driver.get(config.baseUrl);

    const keywordField = await driver.findElement(By.name("keyword"));
    const cityField = await driver.findElement(By.name("city"));

    const keywordRequired = await keywordField.getAttribute("required");
    const cityRequired = await cityField.getAttribute("required");

    fieldRequirements = {
      keyword: keywordRequired ? "required" : "optional",
      city: cityRequired ? "required" : "optional",
    };

    const scenarios = [
      {
        keyword: testData.search.keyword,
        city: testData.search.city,
        name: "Full Search (Keyword + City)",
      },
      {
        keyword: testData.search.keyword,
        city: "",
        name: "Keyword Only Search",
      },
      { keyword: "", city: testData.search.city, name: "City Only Search" },
    ];

    for (const scenario of scenarios) {
      const result = await performSearch(
        driver,
        scenario.keyword,
        scenario.city,
        scenario.name,
        fieldRequirements.keyword === "required"
      );
      results.push(result);

      await driver.get(config.baseUrl);
    }

    const allPassed = results.every((r) => r.status === "PASS");
    const summary = {
      "Field Requirements": `Keyword: ${fieldRequirements.keyword}, City: ${fieldRequirements.city}`,
      "Scenarios Tested": results.length,
      "Scenario Details": results.map(
        (r) =>
          `${r.scenario} - ${r.status} (${r.responseTime}ms): ${r.checks.join(
            ", "
          )}${r.error ? " Error: " + r.error : ""}`
      ),
    };

    logTestResult(allPassed ? "PASS" : "FAIL", TEST_NAME, summary);

    return { name: TEST_NAME, status: allPassed ? "PASS" : "FAIL" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(
      driver,
      "search_business_error"
    );

    logTestResult("FAIL", TEST_NAME, {
      "Field Requirements": fieldRequirements,
      "Failure Reason": error.message,
      Screenshot: screenshotPath,
      "Partial Results": results,
    });

    return { name: TEST_NAME, status: "FAIL" };
  } finally {
    await driver.quit();
  }
}

module.exports = searchBusinessTest;
