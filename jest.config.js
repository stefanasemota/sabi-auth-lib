module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Ensure Jest looks in the src folder
  roots: ["<rootDir>/src/"],
  // Look for files in __tests__ or files ending in .test.ts or .spec.ts
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  // This is required to generate the report SonarCloud needs
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["lcov", "text"],
};
