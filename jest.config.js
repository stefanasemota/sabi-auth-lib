module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Force Jest to only look at the src directory
  roots: ["<rootDir>/src/"],
  // Tell Jest to look for TypeScript files
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  // This ensures Jest maps the coverage to the TS files
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/__tests__/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["lcov", "text", "clover"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};
