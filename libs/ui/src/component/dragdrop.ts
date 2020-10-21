import { BuildPropertiesDefinition } from "../buildmode/buildpropdefinition"
import { parseKey } from "./path"
import {
	getPropertiesDefinition,
	getPropertiesDefinitionFromPath,
} from "./registry"

function createComponentBankKey(namespace: string, name: string): string {
	return `component-${namespace}-${name}`
}

function createFieldBankKey(collectionKey: string, fieldKey: string): string {
	return `field-${collectionKey}-${fieldKey}`
}

function isComponentBankKey(key: string): boolean {
	return key.startsWith("component-")
}

function parseComponentBankKey(key: string): [string, string] {
	const [, namespace, name] = key.split("-")
	return [namespace, name]
}

function isFieldBankKey(key: string): boolean {
	return key.startsWith("field-")
}

function parseFieldBankKey(key: string): [string, string, string] {
	const [, collectionKey, fieldKey] = key.split("-")
	const [namespace, name] = parseKey(fieldKey)
	return [namespace, name, collectionKey]
}

function getPropertiesDefinitionFromDragNode(
	dragNode: string
): BuildPropertiesDefinition | null {
	// Get the component id from the draggable id
	if (isComponentBankKey(dragNode)) {
		const [namespace, name] = parseComponentBankKey(dragNode)
		return getPropertiesDefinition(namespace, name)
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
	parseComponentBankKey,
	isFieldBankKey,
	parseFieldBankKey,
	getPropertiesDefinitionFromDragNode,
}
