const { getJestProjects } = require("@nrwl/jest")

module.exports = {
	projects: [
		...getJestProjects(),
		"<rootDir>/libs/uesioapps/uesio",
		"<rootDir>/libs/uesioapps/sample",
		"<rootDir>/libs/uesioapps/crm",
		"<rootDir>/libs/loginhelpers",
		"<rootDir>/libs/vendor",
		"<rootDir>/apps/cli",
	],
}
