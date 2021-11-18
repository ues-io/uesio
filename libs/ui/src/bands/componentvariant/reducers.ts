import { setWith, toPath } from "lodash"
import { Definition, YamlDoc } from "../../definition/definition"
import { parse, setNodeAtPath } from "../../yamlutils/yamlutils"
import { SetDefinitionPayload } from "../builder"
import { ComponentVariant } from "./types"

const getNewNode = (yaml: YamlDoc, definition: Definition) => {
	//Keep this line on top; 0 is false in JS, but we want to write it to YAML
	if (definition === 0) {
		return yaml.createNode(definition)
	}

	if (!definition) {
		return null
	}

	return yaml.createNode(definition)
}

const setDef = (state: ComponentVariant, payload: SetDefinitionPayload) => {
	const { path, definition } = payload
	const pathArray = toPath(path)

	// Set the definition JS Object
	setWith(state, ["definition", ...pathArray], definition)
	if (state.yaml) {
		// create a new document so components using useYaml will rerender
		state.yaml = parse(state.yaml.toString())
		const newNode = getNewNode(state.yaml, definition)
		setNodeAtPath(path, state.yaml.contents, newNode)
	}
}

export { setDef }
