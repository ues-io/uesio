export default {
  displayName: "studio",
  preset: "../../../../jest.preset.cjs",
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  coverageDirectory: "../../../../coverage/libs/apps/uesio/studio",
  transformIgnorePatterns: [
    "/node_modules/(?!(react-hotkeys-hook)/)",
    "\\.pnp\\.[^\\\/]+$",
  ],
}
