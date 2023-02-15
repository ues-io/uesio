import { FunctionComponent } from "react"
import { wire, definition, context, component } from "@uesio/ui"
import { ListFieldOptions } from "../../components/field/field"

interface ListFieldDeckUtilityProps extends definition.UtilityProps {
	mode: context.FieldMode
	value: wire.FieldValue
	path: string
	options?: ListFieldOptions
}

const ListFieldDeck: FunctionComponent<ListFieldDeckUtilityProps> = (props) => {
	const value = props.value as wire.PlainWireRecord[]
	return (
		<>
			{value?.map((record, i) => (
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

export { ListFieldDeckUtilityProps }
export default ListFieldDeck
