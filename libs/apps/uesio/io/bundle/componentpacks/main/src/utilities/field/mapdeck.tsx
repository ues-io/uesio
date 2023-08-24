import { wire, definition, context, component } from "@uesio/ui"
import { MapFieldOptions } from "../mapfield/MapFieldOptions"

interface MapFieldDeckUtilityProps {
	mode: context.FieldMode
	value: wire.FieldValue
	path: string
	options?: MapFieldOptions
}

const MapFieldDeck: definition.UtilityComponent<MapFieldDeckUtilityProps> = (
	props
) => {
	const value = props.value as Record<string, wire.PlainWireRecord>
	const values = value
		? Object.entries(value).map(([key, item]) => ({
				key,
				value: item,
		  }))
		: []
	return (
		<>
			{values.map((record) => (
				<component.Slot
					key={record.key}
					definition={props.options}
					listName="components"
					path={props.path}
					context={props.context.addRecordDataFrame(record)}
				/>
			))}
		</>
	)
}

export default MapFieldDeck
