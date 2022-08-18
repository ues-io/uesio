const makeViewId = (viewdef: string, path?: string) =>
	`${viewdef}(${path || ""})`

export { makeViewId }
