import { component, definition, metadata, api } from "@uesio/ui"
import { getBuilderNamespace } from "../../api/stateapi"
import ItemTag from "../../utilities/itemtag/itemtag"

const WireTag: definition.UC = (props) => {
	const { context } = props
	const NamespaceLabel = component.getUtility("uesio/io.namespacelabel")
	const IconLabel = component.getUtility("uesio/io.iconlabel")
	const record = context.getRecord()
	const wireId = record?.getFieldValue("key") as string
	const wire = api.wire.useWire(wireId, context)

	if (!record) return null

	const collection = record.getFieldValue("value->collection") as string

	const nsInfo = getBuilderNamespace(
		context,
		collection as metadata.MetadataKey
	)

	const errors = wire
		? wire.getErrorArray()?.map((error) => error.message) || []
		: ["Invalid Wire Definition"]

	const hasErrors = errors.length > 0

	return (
		<ItemTag context={context}>
			<IconLabel
				icon={hasErrors ? "error" : "check_circle"}
				fill={false}
				color={hasErrors ? "red" : "green"}
				tooltip={hasErrors ? errors.join(" ") : ""}
				text={wireId}
				context={context}
			/>
			<NamespaceLabel
				metadatainfo={nsInfo}
				context={context}
				metadatakey={collection}
				styleTokens={{
					root: [
						"text-xs",
						"bg-slate-900",
						"rounded",
						"pl-1",
						"pr-2",
						"uppercase",
					],
				}}
			/>
		</ItemTag>
	)
}

export default WireTag
