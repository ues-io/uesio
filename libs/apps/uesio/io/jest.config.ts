export default {
  displayName: "io",
  preset: "../../../../jest.preset.cjs",
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  coverageDirectory: "../../../../coverage/libs/apps/uesio/io",
  transformIgnorePatterns: [
    "/node_modules/(?!(react-hotkeys-hook)/)",
    "\\.pnp\\.[^\\/]+$",
  ],
}
