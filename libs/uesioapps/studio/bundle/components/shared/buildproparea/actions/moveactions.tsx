import { FunctionComponent } from "react"
import { hooks, component, definition, util } from "@uesio/ui"
import { ActionProps } from "./actiondefinition"
import ActionButton from "./actionbutton"
import { ValueAPI } from "../../propertiespaneldefinition"

const processMaps = (
	metadataType: string,
	metadataItem: string,
	valueAPI: ValueAPI
): [
	number,
	number,
	boolean,
	string,
	{
		key: string
		value: definition.Definition
	}[]
] => {
	const parentDef = valueAPI.get(
		'["' + metadataType + '"]'
	) as definition.DefinitionMap
	console.log("parentDef", parentDef)
	const map = new Map(Object.entries(parentDef))
	console.log("map", map)
	const array = Array.from(map, ([key, value]) => ({ key, value }))
	console.log("array", array)

	const size = array.length

	const getIndex = (element: { key: string; value: definition.Definition }) =>
		element.key === metadataItem
	const index = array.findIndex(getIndex)

	console.log("index", index)
	return [index, size, true, "", array]
}

const moveToIndexComponents = (
	index: number,
	path: string,
	parentPath: string,
	valueAPI: ValueAPI
) => {
	const toPath = `${parentPath}["${index}"]`

	const suffix = component.path.getPathSuffix(path)
	const newSelectedPath = `${toPath}["${suffix}"]`
	console.log("newSelectedPath", newSelectedPath)
	valueAPI.move(path, newSelectedPath)
}

const processComponents = (
	path: string,
	valueAPI: ValueAPI
): [number | null, number, boolean, string] => {
	const index = component.path.getIndexFromPath(path)

	const indexPath = component.path.getIndexPath(path)
	const parentPath = component.path.getParentPath(indexPath)
	const parentDef = valueAPI.get(parentPath) as definition.Definition[]
	const size = parentDef?.length

	return [index, size, false, parentPath]
}

const swapElement = (
	indexA: number,
	indexB: number,
	array:
		| {
				key: string
				value: definition.Definition
		  }[]
): {
	key: string
	value: definition.Definition
}[] => {
	var tmp = array[indexA]
	array[indexA] = array[indexB]
	array[indexB] = tmp
	return array
}
const moveToIndexMaps = (
	index: number,
	oldIndex: number,
	mapArray:
		| {
				key: string
				value: definition.Definition
		  }[]
		| undefined,
	metadataType: string,
	valueAPI: ValueAPI
) => {
	if (mapArray) {
		const newMapArray = swapElement(index, oldIndex, mapArray)
		console.log("newMapArray", newMapArray)
		console.log("metadataType", metadataType)

		//valueAPI.remove('["' + metadataType + '"]')

		newMapArray.forEach((element, index, array) => {
			valueAPI.remove(
				'["' + metadataType + '"]' + '["' + element.key + '"]'
			)
			valueAPI.addPair(
				'["' + metadataType + '"]',
				element.value,
				element.key
			)
		})
	}
}

const moveToIndex = (
	index: number,
	oldIndex: number,
	isMap: boolean,
	path: string,
	parentPath: string,
	valueAPI: ValueAPI,
	mapArray:
		| {
				key: string
				value: definition.Definition
		  }[]
		| undefined,
	metadataType: string
) => {
	if (isMap) {
		moveToIndexMaps(index, oldIndex, mapArray, metadataType, valueAPI)
	} else {
		moveToIndexComponents(index, path, parentPath, valueAPI)
	}
}

const MoveActions: FunctionComponent<ActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { path = "", valueAPI, context } = props

	console.log("PATH", path)

	// Pop off the first item of the path and check to see if its a number

	const [metadataType, metadataItem] = component.path.getFullPathParts(path)

	const [index, size, isMap, parentPath, mapArray] =
		metadataType === "wires"
			? processMaps(metadataType, metadataItem, valueAPI)
			: processComponents(path, valueAPI)

	//if (index == null) return null

	const enableBackward = !!index
	const enableForward = index !== null && size && index < size - 1

	const onClickBackward = () =>
		index &&
		moveToIndex(
			index - 1,
			index,
			isMap,
			path,
			parentPath,
			valueAPI,
			mapArray,
			metadataType
		)
	const onClickForward = () =>
		index !== null &&
		moveToIndex(
			index + 1,
			index,
			isMap,
			path,
			parentPath,
			valueAPI,
			mapArray,
			metadataType
		)
	return (
		<>
			<ActionButton
				title="Move Backward"
				onClick={onClickBackward}
				icon="arrow_upward"
				disabled={!enableBackward}
				context={context}
			/>
			<ActionButton
				title="Move Forward"
				onClick={onClickForward}
				icon="arrow_downward"
				disabled={!enableForward}
				context={context}
			/>
		</>
	)
}

export default MoveActions
