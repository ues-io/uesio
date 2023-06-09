import { FunctionComponent } from "react"
import { definition, component, api, wire } from "@uesio/ui"

interface Props extends definition.UtilityProps {
	namespace: string
	value: wire.PlainWireRecord
	setValue: (value: wire.PlainWireRecord) => void
}

const TranslationItem: FunctionComponent<Props> = (props) => {
	const MapField = component.getUtility("uesio/io.mapfield")
	const { context, namespace, value, setValue } = props

	const [metadata] = api.builder.useMetadataList(context, "LABEL", namespace)

	if (!metadata) return null

	const namespaceValues = Object.keys(value || {})
		.filter((key) => key.startsWith(namespace + "."))
		.reduce(
			(obj, key) => ({
				...obj,
				[key]: value[key],
			}),
			{}
		)
	const nonNamespaceValues = Object.keys(value || {})
		.filter((key) => !key.startsWith(namespace + "."))
		.reduce(
			(obj, key) => ({
				...obj,
				[key]: value[key],
			}),
			{}
		)

	return (
		<div>
			<h4>{namespace}</h4>
			<MapField
				value={namespaceValues}
				noAdd
				setValue={(value: wire.PlainWireRecord) =>
					setValue({
						...nonNamespaceValues,
						...value,
					})
				}
				mode="EDIT"
				context={context}
				keys={Object.keys(metadata)}
				keyField={{
					name: "key",
					label: "Label",
				}}
				valueField={{
					name: "value",
					label: "Translation",
				}}
			/>
		</div>
	)
}

export default TranslationItem
