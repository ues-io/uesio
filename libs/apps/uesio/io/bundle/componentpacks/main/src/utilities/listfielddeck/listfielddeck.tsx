import { FunctionComponent } from "react"
import { wire, definition, context, component } from "@uesio/ui"
import { ListFieldOptions } from "../../components/field/fielddefinition"

interface ListFieldDeckUtilityProps extends definition.UtilityProps {
	mode: context.FieldMode
	value: wire.PlainWireRecord[]
	options?: ListFieldOptions
}

const ListFieldDeck: FunctionComponent<ListFieldDeckUtilityProps> = (props) => (
	<>
		{props.value.map((record, i) => (
			<component.Slot
				key={i}
				definition={props.options}
				listName="components"
				path={props.path}
				accepts={["uesio.standalone"]}
				context={props.context.addFrame({
					recordData: record,
				})}
			/>
		))}
	</>
)

export { ListFieldDeckUtilityProps }
export default ListFieldDeck
