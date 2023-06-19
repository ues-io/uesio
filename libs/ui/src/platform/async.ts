export const respondJSON = async (response: Response) => {
	interceptPlatformRedirects(response)
	if (response.status !== 200) {
		const errorText = await response.text()
		throw new Error(
			errorText
				? errorText
				: "We are sorry, something went wrong on our side"
		)
	}

	return response.json()
}

export const respondVoid = async (response: Response) => {
	interceptPlatformRedirects(response)
	if (response.status !== 200) {
		const errorText = await response.text()
		throw new Error(errorText)
	}

	return
}

function interceptPlatformRedirects(response: Response) {
	const locationHeader = response.headers.get("location")
	if (locationHeader) {
		window.location.href = locationHeader
	}
}

export const getJSON = (url: string) =>
	fetch(url, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"Accept-Encoding": "gzip, deflate",
		},
	}).then(respondJSON)

export const postJSON = (url: string, body?: Record<string, unknown>) =>
	fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		...(body && {
			body: JSON.stringify(body),
		}),
	})
