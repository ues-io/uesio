import { FunctionComponent, useState } from "react"
import {
	definition,
	styles,
	collection,
	component,
	hooks,
	wire,
} from "@uesio/ui"

interface Props extends definition.BaseProps {
	namespace: string
	value: wire.PlainWireRecord
	setValue: (value: wire.PlainWireRecord) => void
}

const MapField = component.registry.getUtility("io.mapfield")

const TranslationItem: FunctionComponent<Props> = (props) => {
	const { context, namespace, value, setValue } = props
	const uesio = hooks.useUesio(props)

	const metadata = uesio.builder.useMetadataList(context, "LABEL", namespace)

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
				subType="MAP"
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
