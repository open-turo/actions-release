const config = {
  coverageDirectory: "reports/coverage",
  coverageReporters: ["lcov", "html"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "~/(.*)": "<rootDir>/src/$1",
    "~test/*": ["./test/*"],
  },
  preset: "ts-jest/presets/default-esm",
  prettierPath: require.resolve("prettier-2"),
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  roots: ["<rootDir>/test", "<rootDir>/src"],
};

export default config;
