# EthioFind Selenium Test Suite

[![CI Status](https://github.com/respanyu/efind-test/workflows/Selenium%20CI%20Tests/badge.svg)](https://github.com/respanyu/efind-test/actions)

Automated Selenium WebDriver tests for the EthioFind Ethiopian business directory website.

## 🚀 Quick Start

```bash
git clone https://github.com/respanyu/efind-test.git
cd efind-test
npm install
npm test
```

## 📋 Prerequisites

- Node.js (v14+)
- Google Chrome
- npm

## 🧪 Available Tests

### Page Load Tests

```bash
npm run test:home                    # Home page
npm run test:login                   # Login page
npm run test:register                # Register page
npm run test:categories              # Categories page
npm run test:singleBusinessDetails   # Business details
npm run test:singleCategoryDetails   # Category details
```

### User Authentication

```bash
npm run test:userRegister            # User registration
npm run test:userLogin               # User login
npm run test:userLogout              # User logout
npm run test:userActivateAccount     # Account activation
npm run test:userPasswordReset       # Password reset
npm run test:userDeleteAccount       # Account deletion
```

### Business Management

```bash
npm run test:addBusiness             # Add business
npm run test:editBusiness            # Edit business
npm run test:claimBusiness           # Claim business
npm run test:searchBusiness          # Search businesses
npm run test:businessLogoUpload      # Logo upload
```

### Advanced Features

```bash
npm run test:businessInquiry         # Business inquiries
npm run test:sessionPersistence      # Session handling
npm run test:pageNotFound            # 404 pages
npm run test:footerLinks             # Footer links
```

## 📊 Test Results

- Console output with pass/fail status
- Response times and performance metrics
- Automatic screenshots on failures (`reports/screenshots/`)
- Detailed logs in `reports/` directory

## ⚙️ Configuration

- `config/config.js` - Base URLs and timeouts
- `config/driver.js` - Browser settings
- Individual `testData.js` files - Test data

## 🏗️ Project Structure

```
ethiofind-2/
├── .github/workflows/     # CI/CD
├── config/               # Configuration
├── tests/                # Test modules
├── utils/                # Helpers (logger, screenshot, timer)
├── reports/              # Results and screenshots
├── server.js            # Test runner
└── package.json         # Dependencies
```

## 🔧 Troubleshooting

- **Chrome issues**: Update Chrome and ChromeDriver
- **Network timeouts**: Check internet connection
- **CI failures**: Check `reports/screenshots/` for details
- **Permissions**: Ensure write access to `reports/` directory

## 🤝 Contributing

1. Create test directory under `tests/`
2. Add `testData.js` and `[name].test.js`
3. Register in `server.js`
4. Add npm script in `package.json`

## 📄 License

ISC License - see [LICENSE](LICENSE) file.

---
