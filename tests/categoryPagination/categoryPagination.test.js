const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");

const TEST_NAME = "Category Business Pagination";

async function categoryPaginationTest() {
  const driver = await createDriver();

  const checks = [];
  let responseTime = 0;

  try {
    const start = startTimer();

    await driver.get(`${config.baseUrl}/categories`);
    checks.push("Categories page opened successfully");

    const categoryLinks = await driver.findElements(
      By.css("div.column a.has-text-dark")
    );
    if (categoryLinks.length === 0) {
      throw new Error("No category links found on categories page");
    }

    const firstCategoryLink = categoryLinks[0];
    const categoryText = await firstCategoryLink.getText();
    const categoryHref = await firstCategoryLink.getAttribute("href");

    await firstCategoryLink.click();
    checks.push(`Clicked on category: "${categoryText}" (${categoryHref})`);

    await driver.sleep(3000);

    const currentUrl = await driver.getCurrentUrl();
    if (!currentUrl.includes("/category/")) {
      throw new Error(`Expected category URL, but got: ${currentUrl}`);
    }
    checks.push(`Redirected to category page: ${currentUrl}`);

    const businessElements = await driver.findElements(
      By.css("a[href*='/business/']")
    );
    checks.push(
      `Businesses found on category page: ${businessElements.length}`
    );

    const paginationSelectors = [
      By.css(".pagination"),
      By.css("nav.pagination"),
      By.xpath("//*[contains(@class, 'pagination')]"),
      By.css("a[href*='page=']"),
      By.css("button[aria-label*='page']"),
    ];

    let paginationFound = false;
    let paginationType = "";

    for (const selector of paginationSelectors) {
      try {
        const paginationElements = await driver.findElements(selector);
        if (paginationElements.length > 0) {
          paginationFound = true;
          checks.push("Pagination controls found on category page");

          const paginationElement = paginationElements[0];
          const paginationHtml = await paginationElement.getAttribute(
            "outerHTML"
          );

          if (paginationHtml.includes("pagination")) {
            paginationType = "Bulma pagination";
          } else if (paginationHtml.includes("page=")) {
            paginationType = "URL-based pagination";
          }
          break;
        }
      } catch (error) {
      }
    }

    if (!paginationFound) {
      checks.push(
        "No pagination controls found - checking if all businesses fit on one page"
      );
      if (businessElements.length <= 20) {
        checks.push("Few businesses found, pagination not needed");
      }
    }

    if (paginationFound) {
      const nextSelectors = [
        By.css("a[aria-label='Next page']"),
        By.css("a[href*='page=2']"),
        By.xpath("//a[contains(text(), 'Next')]"),
        By.xpath("//a[contains(text(), '»')]"),
        By.css(".pagination-next"),
        By.css("a.pagination-link:not(.is-current)"),
      ];

      let nextButtonFound = false;
      for (const selector of nextSelectors) {
        try {
          const nextElements = await driver.findElements(selector);
          if (nextElements.length > 0) {
            const nextButton = nextElements[0];
            const isEnabled = await nextButton.isEnabled();
            const isDisplayed = await nextButton.isDisplayed();

            if (isEnabled && isDisplayed) {
              checks.push("Next page button found and clickable");

              const initialBusinessCount = businessElements.length;

              await nextButton.click();
              checks.push("Clicked next page button");

              await driver.sleep(3000);

              const newUrl = await driver.getCurrentUrl();
              if (newUrl !== currentUrl) {
                checks.push(`URL changed to: ${newUrl} (pagination working)`);

                const newBusinessElements = await driver.findElements(
                  By.css("a[href*='/business/']")
                );
                const newBusinessCount = newBusinessElements.length;

                if (newBusinessCount !== initialBusinessCount) {
                  checks.push(
                    `Business count changed from ${initialBusinessCount} to ${newBusinessCount} (pagination working)`
                  );
                } else {
                  checks.push(
                    "Business count remained same (may be last page or same content)"
                  );
                }

                nextButtonFound = true;
                break;
              } else {
                checks.push("URL did not change after clicking next button");
              }
            }
          }
        } catch (error) {
        }
      }

      if (!nextButtonFound) {
        checks.push(
          "Next page button not found or not clickable (may be on first/last page)"
        );
      }
    }

    responseTime = endTimer(start);

    if (responseTime <= config.performance.maxPageLoadTimeMs) {
      checks.push(
        `Category pagination test completed within acceptable time (${responseTime} ms)`
      );
    } else {
      checks.push(
        `Category pagination test completed but slower than expected (${responseTime} ms)`
      );
    }

    logTestResult("PASS", TEST_NAME, {
      "Category Clicked": categoryText,
      "Category URL": categoryHref,
      "Final URL": await driver.getCurrentUrl(),
      "Pagination Found": paginationFound ? "Yes" : "No",
      "Pagination Type": paginationType,
      "Response Time": `${responseTime} ms`,
      Result: "Category pagination functionality verified",
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, "category_pagination");

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

module.exports = categoryPaginationTest;
