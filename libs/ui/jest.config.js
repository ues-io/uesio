module.exports = {
  displayName: "ui",
  preset: "../../jest.preset.js",
  clearMocks: true,
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  coverageDirectory: "../../coverage/libs/ui",
  setupFilesAfterEnv: ["./jest-test-setup.js"],
}
