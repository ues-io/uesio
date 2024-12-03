const { getJestProjectsAsync } = require("@nx/jest")

module.exports = {
	projects: [...getJestProjectsAsync()],
}
