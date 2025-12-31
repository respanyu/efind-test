const testHomePageLoad = require("./tests/pageLoad/homePageLoad.test");
const testLoginPageLoad = require("./tests/pageLoad/loginPageLoad.test");
const testAboutPageLoad = require("./tests/pageLoad/aboutPageLoad.test");
const testRegisterPageLoad = require("./tests/pageLoad/registerPageLoad.test");
const testCategoriesPageLoad = require("./tests/pageLoad/categoriesPageLoad.test");
const testSingleBusinessDetails = require("./tests/pageLoad/singleBusinessDetails.test");
const testSingleCategoryDetails = require("./tests/pageLoad/singleCategoryDetails.test");
const categoryPaginationTest = require("./tests/categoryPagination/categoryPagination.test");
const footerLinksTest = require("./tests/footerLinks/footerLinks.test");
const userRegisterTest = require("./tests/userRegister/userRegister.test");
const userLoginTest = require("./tests/userLogin/userLogin.test");
const userDeleteAccountTest = require("./tests/userDeleteAccount/userDeleteAccount.test");
const userActivateAccountTest = require("./tests/userActivateAccount/userActivateAccount.test");
const userLogoutTest = require("./tests/userLogout/userLogout.test");
const userPasswordResetTest = require("./tests/userPasswordReset/userPasswordReset.test");
const addBusinessTest = require("./tests/addBusiness/addBusiness.test");
const claimBusinessTest = require("./tests/claimBusiness/claimBusiness.test");
const editBusinessTest = require("./tests/editBusiness/editBusiness.test");
const searchBusinessTest = require("./tests/searchBusiness/searchBusiness.test");
const userAddBusinessWhileLoggedInTest = require("./tests/userAddBusinessWhileLoggedIn/userAddBusinessWhileLoggedIn.test");
const businessInquiryTest = require("./tests/businessInquiry/businessInquiry.test");
const businessInquiryDisabledTest = require("./tests/businessInquiryDisabled/businessInquiryDisabled.test");
const pageNotFoundTest = require("./tests/pageNotFound/pageNotFound.test");
const sessionPersistenceTest = require("./tests/sessionPersistence/sessionPersistence.test");
const businessLogoUploadTest = require("./tests/businessLogoUpload/businessLogoUpload.test");

async function runAllTests() {
  console.log("\n🚀 Ethiofind Selenium Automation Started\n");

  const results = [];
  const testToRun = process.env.TEST;

  if (!testToRun || testToRun === "home") {
    results.push(await testHomePageLoad());
  }
  if (!testToRun || testToRun === "login") {
    results.push(await testLoginPageLoad());
  }
  if (!testToRun || testToRun === "about") {
    results.push(await testAboutPageLoad());
  }
  if (!testToRun || testToRun === "register") {
    results.push(await testRegisterPageLoad());
  }

  if (!testToRun || testToRun === "categories") {
    results.push(await testCategoriesPageLoad());
  }
  if (!testToRun || testToRun === "categoryPagination") {
    results.push(await categoryPaginationTest());
  }
  if (!testToRun || testToRun === "singleBusinessDetails") {
    results.push(await testSingleBusinessDetails());
  }
  if (!testToRun || testToRun === "singleCategoryDetails") {
    results.push(await testSingleCategoryDetails());
  }
  if (!testToRun || testToRun === "userRegister") {
    results.push(await userRegisterTest());
  }
  if (!testToRun || testToRun === "userActivateAccount") {
    results.push(await userActivateAccountTest());
  }
  if (!testToRun || testToRun === "userLogin") {
    results.push(await userLoginTest());
  }
  if (!testToRun || testToRun === "userLogout") {
    results.push(await userLogoutTest());
  }
  if (!testToRun || testToRun === "userPasswordReset") {
    results.push(await userPasswordResetTest());
  }
  if (!testToRun || testToRun === "addBusiness") {
    results.push(await addBusinessTest());
  }
  if (!testToRun || testToRun === "claimBusiness") {
    results.push(await claimBusinessTest());
  }
  if (!testToRun || testToRun === "editBusiness") {
    results.push(await editBusinessTest());
  }
  if (!testToRun || testToRun === "searchBusiness") {
    results.push(await searchBusinessTest());
  }
  if (!testToRun || testToRun === "userAddBusinessWhileLoggedIn") {
    results.push(await userAddBusinessWhileLoggedInTest());
  }
  if (!testToRun || testToRun === "businessInquiry") {
    results.push(await businessInquiryTest());
  }
  if (!testToRun || testToRun === "businessInquiryDisabled") {
    results.push(await businessInquiryDisabledTest());
  }
  if (!testToRun || testToRun === "pageNotFound") {
    results.push(await pageNotFoundTest());
  }
  if (!testToRun || testToRun === "sessionPersistence") {
    results.push(await sessionPersistenceTest());
  }
  if (!testToRun || testToRun === "businessLogoUpload") {
    results.push(await businessLogoUploadTest());
  }
  if (!testToRun || testToRun === "userDeleteAccount") {
    results.push(await userDeleteAccountTest());
  }
  if (!testToRun || testToRun === "footerLinks") {
    results.push(await footerLinksTest());
  }

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  console.log("\n📊 Test Summary");
  console.log("--------------------------");
  console.log(`🧪 Total Tests : ${results.length}`);
  console.log(`✅ Passed      : ${passed}`);
  console.log(`❌ Failed      : ${failed}`);
  console.log("--------------------------\n");
}

runAllTests();
