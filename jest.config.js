module.exports = {
  "testEnvironment": "enzyme",
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "testRegex": "test.ts",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx"
  ],
  "globals": {
    "ts-jest": {
      "skipBabel": true
    }
  }
};
