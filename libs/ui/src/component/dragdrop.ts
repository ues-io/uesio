import { parseKey } from "./path"
import {
	getPropertiesDefinition,
	getPropertiesDefinitionFromPath,
} from "./registry"

const createComponentBankKey = (namespace: string, name: string) =>
	`component-${namespace}.${name}`

const createFieldBankKey = (collectionKey: string, fieldKey: string) =>
	`field-${collectionKey}-${fieldKey}`

const isComponentBankKey = (key: string) => key.startsWith("component-")

const parseComponentBankKey = (key: string): string => {
	const [, componentType] = key.split("-")
	return componentType
}

const isFieldBankKey = (key: string) => key.startsWith("field-")

const parseFieldBankKey = (key: string): [string, string, string] => {
	const [, collectionKey, fieldKey] = key.split("-")
	const [namespace, name] = parseKey(fieldKey)
	return [namespace, name, collectionKey]
}

const getPropertiesDefinitionFromDragNode = (dragNode: string) => {
	// Get the component id from the draggable id
	if (isComponentBankKey(dragNode)) {
		const componentType = parseComponentBankKey(dragNode)
		return getPropertiesDefinition(componentType)
	} else if (isFieldBankKey(dragNode)) {
		const [namespace, name, collectionKey] = parseFieldBankKey(dragNode)
		return {
			title: name,
			sections: [],
			defaultDefinition: () => ({}),
			traits: ["uesio.field", "wire." + collectionKey],
			namespace,
			name,
		}
	}
	return getPropertiesDefinitionFromPath(dragNode)
}

export {
	createComponentBankKey,
	createFieldBankKey,
	isComponentBankKey,
	isFieldBankKey,
	getPropertiesDefinitionFromDragNode,
}
