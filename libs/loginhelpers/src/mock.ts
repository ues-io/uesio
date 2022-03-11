const mockUsers = ["ben", "abel", "wessel", "gregg"]

const getMockToken = (user: string) =>
	JSON.stringify({
		authType: "mock",
		subject: user,
	})

export { mockUsers, getMockToken }
