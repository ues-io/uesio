module.exports = {
  displayName: "ui",
  preset: "../../jest.preset.js",
  clearMocks: true,
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  coverageDirectory: "../../coverage/libs/ui",
  setupFiles: ["./jest-test-setup.js"],
}
