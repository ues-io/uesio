export default {
  displayName: "core",
  preset: "../../../../jest.preset.cjs",
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  coverageDirectory: "../../../../coverage/libs/apps/uesio/core",
}
