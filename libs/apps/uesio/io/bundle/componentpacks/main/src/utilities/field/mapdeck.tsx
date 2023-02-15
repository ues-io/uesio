import { FunctionComponent } from "react"
import { wire, definition, context, component } from "@uesio/ui"
import { ListFieldOptions } from "../../components/field/field"

interface MapFieldDeckUtilityProps extends definition.UtilityProps {
	mode: context.FieldMode
	value: wire.FieldValue
	path: string
	options?: ListFieldOptions
}

const MapFieldDeck: FunctionComponent<MapFieldDeckUtilityProps> = (props) => {
	const value = props.value as Record<string, wire.PlainWireRecord>
	const values = value
		? Object.entries(value).map(([key, item]) => ({
				key,
				value: item,
		  }))
		: []
	return (
		<>
			{values.map((record, i) => (
				<component.Slot
					key={i}
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
