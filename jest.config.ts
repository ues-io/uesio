const { getJestProjects } = require("@nrwl/jest")

export default {
	projects: [...getJestProjects()],
	setupFiles: ["whatwg-fetch"],
	setupFilesAfterEnv: [".<rootDir>/setup-jest.js"],
}
