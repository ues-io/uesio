type MockUser = {
	firstname: string
	lastname: string
}

const mockUsers = [
	{ firstname: "Ben", lastname: "Hubbard" },
	{ firstname: "Abel", lastname: "Jimenez Molla" },
	{ firstname: "Wessel", lastname: "van der Plas" },
	{ firstname: "Gregg", lastname: "Baxter" },
]

const getMockToken = (user: MockUser) =>
	JSON.stringify({
		authType: "mock",
		username: user.firstname.toLowerCase(),
		lastname: user.lastname,
		firstname: user.firstname,
		subject: "Mock" + user.firstname,
		email: user.firstname.toLowerCase() + "@thecloudmasters.com",
	})

export { mockUsers, getMockToken }
