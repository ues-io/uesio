export default {
  displayName: "builder",
  preset: "../../../../jest.preset.cjs",
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  coverageDirectory: "../../../../coverage/libs/apps/uesio/builder",
  transformIgnorePatterns: [
    "/node_modules/(?!(react-hotkeys-hook)/)",
    "\\.pnp\\.[^\\/]+$",
  ],
}
