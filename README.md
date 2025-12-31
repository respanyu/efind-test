# EthioFind Selenium Test Suite

A comprehensive Selenium WebDriver test suite for testing the EthioFind Ethiopian business directory website functionality.

## Prerequisites

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **Google Chrome** browser
- **ChromeDriver** (automatically managed)

## Installation

1. Clone or download the project
2. Navigate to the project directory:
   ```bash
   cd ethiofind-2
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test Categories

#### Page Load Tests

```bash
npm run test:home              # Home page load
npm run test:login             # Login page load
npm run test:about             # About page load
npm run test:register          # Register page load
npm run test:categories        # Categories page load
npm run test:categoryPagination # Category pagination
```

#### User Authentication Tests

```bash
npm run test:userRegister      # User registration
npm run test:userLogin         # User login
npm run test:userLogout        # User logout
npm run test:userDeleteAccount # Account deletion
npm run test:userActivateAccount # Account activation
npm run test:userPasswordReset # Password reset
```

#### Business Tests

```bash
npm run test:addBusiness       # Add business
npm run test:claimBusiness     # Claim business
npm run test:editBusiness      # Edit business
npm run test:searchBusiness    # Search businesses
npm run test:businessInquiry   # Business inquiry (logged in)
npm run test:businessInquiryDisabled # Business inquiry (not logged in)
```

#### Advanced Tests

```bash
npm run test:sessionPersistence # Session persistence across tabs
npm run test:singleBusinessDetails # Individual business page
npm run test:singleCategoryDetails # Individual category page
npm run test:pageNotFound # 404 error page handling
```

## Test Results

- Test results are displayed in the console
- Screenshots are automatically captured on test failures
- Logs are saved in the `reports/` directory
- Each test shows:
  - ✅ Pass/Fail status
  - Response time
  - Detailed checks performed
  - Any error messages

## Configuration

Test configuration can be modified in:

- `config/config.js` - Base URLs, timeouts, performance thresholds
- `config/driver.js` - Browser settings
- Individual test `testData.js` files - Test data and credentials

## Browser Requirements

- Tests run on Google Chrome by default
- ChromeDriver is automatically managed
- Headless mode can be configured in `config/driver.js`

## Troubleshooting

1. **ChromeDriver issues**: Make sure Chrome browser is installed and up to date
2. **Network timeouts**: Check internet connection and website availability
3. **Test failures**: Check `reports/screenshots/` for failure screenshots
4. **Permission issues**: Ensure write permissions for `reports/` directory

## Adding New Tests

1. Create a new directory under `tests/`
2. Add `testData.js` for test data
3. Create `[testName].test.js` with test logic
4. Add import and condition in `server.js`
5. Add npm script in `package.json`

## Support

For issues or questions about the test suite, check the test logs and screenshots in the `reports/` directory.
