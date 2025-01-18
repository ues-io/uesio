const makeViewId = (viewdef: string, componentId?: string) =>
  `${viewdef}(${componentId || ""})`

export { makeViewId }
