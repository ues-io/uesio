import { definition, api } from "@uesio/ui"

const get = (path: string | undefined): definition.Definition => {
	if (path === undefined) return
	return api.builder.getDefinitionAtPath(path)
}

const set = (
	path: string | undefined,
	definition: definition.Definition,
	autoSelect?: boolean
) => {
	if (path === undefined) return
	api.builder.setDefinition(path, definition, autoSelect)
}

const remove = (path: string | undefined) => {
	if (path === undefined) return
	api.builder.removeDefinition(path)
}

const move = (fromPath: string, toPath: string, selectKey?: string) => {
	if (fromPath === undefined || toPath === undefined) return
	api.builder.moveDefinition(fromPath, toPath, selectKey)
}

const clone = (path: string) => {
	if (path === undefined) return
	api.builder.cloneDefinition(path)
}

const cloneKey = (path: string) => {
	if (path === undefined) return
	api.builder.cloneKeyDefinition(path)
}

export { set, remove, move, get, clone, cloneKey }
