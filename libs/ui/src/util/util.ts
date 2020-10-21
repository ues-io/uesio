interface HasKeys {
	[key: string]: unknown
}

function deleteProperty<T extends HasKeys>(original: T, key: string): T {
	// If the name of the property to remove is from a variable
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { [key]: value, ...newObj } = original
	return newObj as T
}

export { deleteProperty }
