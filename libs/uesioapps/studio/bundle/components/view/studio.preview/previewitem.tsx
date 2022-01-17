import { FunctionComponent } from "react"
import { definition, hooks, component, wire } from "@uesio/ui"
import { ParamDefinition } from "./preview"

interface Props extends definition.BaseProps {
	fieldKey: string
	item: ParamDefinition
	lstate: Record<string, string>
	setLstate: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

const FieldWrapper = component.registry.getUtility("io.fieldwrapper")
const AutoComplete = component.registry.getUtility("io.autocomplete")

const PreviewItem: FunctionComponent<Props> = (props) => {
	const { context, fieldKey, item, lstate, setLstate } = props
	const { collectionId } = item
	const uesio = hooks.useUesio(props)

	const fieldId = "uesio.id"

	if (!collectionId) return null

	const itemToString = (item: wire.PlainWireRecord | undefined) =>
		item ? `${item[fieldId]}` : ""

	return (
		<FieldWrapper context={context} label={fieldKey} key={fieldKey}>
			<AutoComplete
				context={context}
				variant="io.default"
				value={lstate[fieldKey]}
				setValue={(value: wire.PlainWireRecord) => {
					const idValue = value[fieldId] as string
					setLstate({
						...lstate,
						[fieldKey]: idValue,
					})
				}}
				itemToString={itemToString}
				itemRenderer={(item: wire.PlainWireRecord, index: number) => (
					<div>{itemToString(item)}</div>
				)}
				getItems={async (
					searchText: string,
					callback: (items: wire.PlainWireRecord[]) => void
				) => {
					const searchFields = [fieldId]
					const returnFields = [fieldId]
					const result = await uesio.platform.loadData(context, {
						wires: [
							{
								wire: "search",
								query: true,
								collection: collectionId,
								fields: returnFields.map((fieldName) => ({
									id: fieldName,
								})),
								conditions: [
									{
										type: "SEARCH",
										value: searchText,
										valueSource: "VALUE",
										active: true,
										fields: searchFields,
									},
								],
							},
						],
					})
					callback(result.wires[0].data || [])
				}}
			/>
		</FieldWrapper>
	)
}

export default PreviewItem
