const { createDriver } = require("../../config/driver");
const { By, until } = require("selenium-webdriver");
const { startTimer, endTimer } = require("../../utils/timer");
const { logTestResult } = require("../../utils/logger");
const { takeScreenshot } = require("../../utils/screenshot");
const config = require("../../config/config");

const TEST_NAME = "Footer Links Navigation";

async function footerLinksTest() {
  const driver = await createDriver();

  const checks = [];
  let responseTime = 0;

  try {
    const start = startTimer();

    await driver.get(config.baseUrl);
    checks.push("Home page opened successfully");

    await driver.executeScript(
      "window.scrollTo(0, document.body.scrollHeight);"
    );
    await driver.sleep(1000);
    checks.push("Scrolled to bottom of page to access footer");

    const footerLinks = [
      {
        text: "register",
        expectedUrl: "/user/register",
        description: "User Registration",
      },
      { text: "help", expectedUrl: "/about", description: "Help/About Page" },
      {
        text: "advertise",
        expectedUrl: "/advertise",
        description: "Advertise Page",
      },
    ];

    for (const link of footerLinks) {
      try {
        const linkElement = await driver.findElement(
          By.xpath(`//a[contains(text(), '${link.text}')]`)
        );

        const href = await linkElement.getAttribute("href");
        checks.push(`Found ${link.description} link: ${href}`);

        await linkElement.click();
        checks.push(`Clicked ${link.description} link`);

        await driver.sleep(2000);

        const currentUrl = await driver.getCurrentUrl();
        if (currentUrl.includes(link.expectedUrl)) {
          checks.push(
            `✅ ${link.description} redirected correctly to: ${currentUrl}`
          );
        } else {
          checks.push(
            `❌ ${link.description} redirect failed. Expected: ${link.expectedUrl}, Got: ${currentUrl}`
          );
        }

        await driver.get(config.baseUrl);
        await driver.sleep(1000);
      } catch (error) {
        checks.push(
          `❌ Error testing ${link.description} link: ${error.message}`
        );
      }
    }

    const categoryLinks = [
      {
        text: "Agriculture & Farming",
        expectedUrl: "/category/agriculture-farming",
      },
      {
        text: "IT & Telecommunications",
        expectedUrl: "/category/it-telecommunications",
      },
      { text: "Food & Beverage", expectedUrl: "/category/food-beverage" },
    ];

    for (const category of categoryLinks) {
      try {
        const categoryElement = await driver.findElement(
          By.xpath(
            `//a[contains(@class, 'tag') and contains(text(), '${
              category.text.split(" & ")[0]
            }')]`
          )
        );

        const href = await categoryElement.getAttribute("href");
        checks.push(`Found category tag: ${category.text} -> ${href}`);

        await categoryElement.click();
        checks.push(`Clicked category: ${category.text}`);

        await driver.sleep(2000);

        const currentUrl = await driver.getCurrentUrl();
        if (currentUrl.includes(category.expectedUrl)) {
          checks.push(
            `✅ Category ${category.text} redirected correctly to: ${currentUrl}`
          );

          const businessElements = await driver.findElements(
            By.css("a[href*='/business/']")
          );
          checks.push(
            `Category page shows ${businessElements.length} businesses`
          );
        } else {
          checks.push(
            `❌ Category ${category.text} redirect failed. Expected: ${category.expectedUrl}, Got: ${currentUrl}`
          );
        }

        await driver.get(config.baseUrl);
        await driver.sleep(1000);
      } catch (error) {
        checks.push(
          `❌ Error testing category ${category.text}: ${error.message}`
        );
      }
    }

    try {
      const emailLink = await driver.findElement(By.css("a[href^='mailto:']"));
      const emailHref = await emailLink.getAttribute("href");
      checks.push(`Found email link: ${emailHref}`);

      if (emailHref && emailHref.includes("mailto:")) {
        checks.push("✅ Email link is properly formatted");
      }
    } catch (error) {
      checks.push("Email link not found or not accessible");
    }

    responseTime = endTimer(start);

    const successfulRedirects = checks.filter(
      (check) =>
        check.includes("✅") &&
        (check.includes("redirected correctly") ||
          check.includes("Email link is properly formatted"))
    ).length;

    const totalLinksTested = footerLinks.length + categoryLinks.length + 1;

    if (successfulRedirects >= totalLinksTested * 0.8) {
      checks.push(
        `Footer links test passed: ${successfulRedirects}/${totalLinksTested} links working correctly`
      );
    } else {
      throw new Error(
        `Footer links test failed: Only ${successfulRedirects}/${totalLinksTested} links working correctly`
      );
    }

    if (responseTime <= config.performance.maxPageLoadTimeMs) {
      checks.push(`Test completed within acceptable time (${responseTime} ms)`);
    } else {
      checks.push(
        `Test completed but slower than expected (${responseTime} ms)`
      );
    }

    logTestResult("PASS", TEST_NAME, {
      "Links Tested": totalLinksTested,
      "Successful Redirects": successfulRedirects,
      "Success Rate": `${Math.round(
        (successfulRedirects / totalLinksTested) * 100
      )}%`,
      "Response Time": `${responseTime} ms`,
      Result: "Footer navigation links tested successfully",
      "Checks Passed": checks,
    });

    return { name: TEST_NAME, status: "PASS" };
  } catch (error) {
    const screenshotPath = await takeScreenshot(driver, "footer_links");

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

module.exports = footerLinksTest;
