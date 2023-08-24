import { definition, component, api, styles, wire } from "@uesio/ui"

interface Props {
	namespace: string
	value: wire.PlainWireRecord
	setValue: (value: wire.PlainWireRecord) => void
}

const StyleDefaults = Object.freeze({
	root: ["mt-10"],
})

const TranslationItem: definition.UtilityComponent<Props> = (props) => {
	const MapField = component.getUtility("uesio/io.mapfield")
	const TitleBar = component.getUtility("uesio/io.titlebar")
	const { context, namespace, value, setValue } = props
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

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
		<div className={classes.root}>
			<TitleBar title={namespace} context={context} />
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
					updateable: false,
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
