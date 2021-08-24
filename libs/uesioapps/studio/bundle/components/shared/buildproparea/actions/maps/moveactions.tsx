import { FunctionComponent } from "react"
import { hooks, component, definition } from "@uesio/ui"
import { ActionProps } from "../actiondefinition"
import ActionButton from "../actionbutton"
import { ValueAPI } from "../../../propertiespaneldefinition"

interface MapElement {
	key: string
	value: definition.Definition
}

const swapElement = (
	indexA: number,
	indexB: number,
	array: MapElement[]
): {
	key: string
	value: definition.Definition
}[] => {
	const tmp = array[indexA]
	array[indexA] = array[indexB]
	array[indexB] = tmp
	return array
}

const MoveActionsMaps: FunctionComponent<ActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { path = "", valueAPI, context } = props

	const [metadataType, metadataItem] = component.path.getFullPathParts(path)

	const parentDef = valueAPI.get(
		'["' + metadataType + '"]'
	) as definition.DefinitionMap

	const map = new Map(Object.entries(parentDef))
	const array = Array.from(map, ([key, value]) => ({ key, value }))
	const size = array.length
	const getIndex = (element: { key: string; value: definition.Definition }) =>
		element.key === metadataItem
	const index = array.findIndex(getIndex)

	const enableBackward = !!index
	const enableForward = index !== null && size && index < size - 1

	const viewDefID = context.getViewDefId()
	if (!viewDefID) return null

	const moveToIndex = (
		newIndex: number,
		oldIndex: number,
		mapArray: MapElement[],
		metadataType: string,
		metadataItem: string,
		valueAPI: ValueAPI
	) => {
		const newMapArray = swapElement(newIndex, oldIndex, mapArray)
		newMapArray.forEach((element) => {
			valueAPI.remove(
				'["' + metadataType + '"]' + '["' + element.key + '"]'
			)
			valueAPI.addPair(
				'["' + metadataType + '"]',
				element.value,
				element.key
			)
		})

		uesio.builder.setSelectedNode(
			"viewdef",
			viewDefID,
			'["' + metadataType + '"]' + '["' + metadataItem + '"]'
		)
	}

	const onClickBackward = () => {
		index &&
			moveToIndex(
				index - 1,
				index,
				array,
				metadataType,
				metadataItem,
				valueAPI
			)
	}
	const onClickForward = () => {
		index !== null &&
			moveToIndex(
				index + 1,
				index,
				array,
				metadataType,
				metadataItem,
				valueAPI
			)
	}
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

export default MoveActionsMaps
