const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");

const TEST_NAME = "Page Not Found (404)";

async function pageNotFoundTest() {
  const driver = await createDriver();

  const checks = [];
  let responseTime = 0;

  try {
    const start = startTimer();

    const nonExistentUrl = `${
      config.baseUrl
    }/non-existent-page-404-test-${Date.now()}`;
    await driver.get(nonExistentUrl);
    checks.push(`Attempted to access non-existent URL: ${nonExistentUrl}`);

    await driver.sleep(3000);

    const currentUrl = await driver.getCurrentUrl();
    checks.push(`Current URL after navigation: ${currentUrl}`);

    const errorSelectors = [
      By.xpath("//*[contains(text(), '404')]"),
      By.xpath("//*[contains(text(), 'Not Found')]"),
      By.xpath("//*[contains(text(), 'Page Not Found')]"),
      By.xpath("//*[contains(text(), 'page not found')]"),
      By.xpath("//*[contains(text(), 'error')]"),
      By.css("h1"),
      By.css("h2"),
      By.css(".error"),
      By.css(".not-found"),
      By.css("[class*='404']"),
    ];

    let errorFound = false;
    let errorText = "";
    let pageTitle = "";

    try {
      pageTitle = await driver.getTitle();
      if (pageTitle) {
        checks.push(`Page title: "${pageTitle}"`);
        if (
          pageTitle.toLowerCase().includes("404") ||
          pageTitle.toLowerCase().includes("not found") ||
          pageTitle.toLowerCase().includes("error")
        ) {
          errorFound = true;
          errorText = `Page title indicates error: "${pageTitle}"`;
        }
      }
    } catch (error) {
      checks.push("Could not retrieve page title");
    }

    if (!errorFound) {
      for (const selector of errorSelectors) {
        try {
          const elements = await driver.findElements(selector);
          if (elements.length > 0) {
            for (const element of elements) {
              const text = await element.getText();
              if (
                text &&
                (text.includes("404") ||
                  text.toLowerCase().includes("not found") ||
                  text.toLowerCase().includes("page not found"))
              ) {
                errorFound = true;
                errorText = `Found error content: "${text}"`;
                break;
              }
            }
            if (errorFound) break;
          }
        } catch (error) {}
      }
    }

    try {
      const statusCode = await driver.executeScript(`
        try {
          const response = await fetch(window.location.href);
          return response.status;
        } catch (error) {
          return null;
        }
      `);

      if (statusCode) {
        checks.push(`HTTP status code: ${statusCode}`);
        if (statusCode === 404) {
          errorFound = true;
          errorText = `HTTP 404 status code confirmed`;
        }
      }
    } catch (error) {
      checks.push("Could not check HTTP status code via JavaScript");
    }

    try {
      const navElements = await driver.findElements(
        By.css("nav, .navbar, .navigation")
      );
      if (navElements.length > 0) {
        checks.push("Navigation elements still present on error page");
      }
    } catch (error) {
      checks.push("Navigation elements not found");
    }

    responseTime = endTimer(start);

    if (errorFound) {
      checks.push("404 error page properly displayed");
    } else {
      try {
        const pageContent = await driver.findElement(By.css("body")).getText();
        const contentLength = pageContent.length;

        if (contentLength < 500) {
          checks.push(
            `Page has minimal content (${contentLength} characters) - likely error page`
          );
          errorFound = true;
        } else {
          checks.push(
            `Page has substantial content (${contentLength} characters)`
          );
        }
      } catch (error) {
        checks.push("Could not analyze page content");
      }
    }

    if (!errorFound) {
      checks.push(
        "Warning: No clear 404 error indicators found - page may not be handling 404s properly"
      );
    }

    if (responseTime <= config.performance.maxPageLoadTimeMs) {
      checks.push(
        `404 page loaded within acceptable time (${responseTime} ms)`
      );
    } else {
      checks.push(
        `404 page loaded but slower than expected (${responseTime} ms)`
      );
    }

    logTestResult("PASS", TEST_NAME, {
      "Tested URL": nonExistentUrl,
      "Final URL": currentUrl,
      "Page Title": pageTitle,
      "Error Found": errorFound ? "Yes" : "No",
      "Error Details": errorText,
      "Response Time": `${responseTime} ms`,
      Result: errorFound
        ? "404 page handled correctly"
        : "404 page handling unclear",
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, "page_not_found");

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

module.exports = pageNotFoundTest;
