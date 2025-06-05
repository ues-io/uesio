export default {
  displayName: "ui",
  preset: "../../jest.preset.cjs",
  clearMocks: true,
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  coverageDirectory: "../../coverage/libs/ui",
  transformIgnorePatterns: [
    "/node_modules/(?!(react-hotkeys-hook)/)",
    "\\.pnp\\.[^\\/]+$",
  ],
}
