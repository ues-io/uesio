import { definition, component, api, styles, wire } from "@uesio/ui"

interface Props {
	namespace: string
	value: wire.PlainWireRecord
	setValue: (value: wire.PlainWireRecord) => void
}

const StyleDefaults = Object.freeze({
	root: ["mt-10"],
})

const getLabelValue = (labelsData: wire.WireRecord[], key: string) => {
	const label = labelsData.find((label) => label.getUniqueKey() === key)
	if (label) {
		return label.getFieldValue("uesio/studio.value")
	}
}

const TranslationItem: definition.UtilityComponent<Props> = (props) => {
	const ListField = component.getUtility("uesio/io.listfield")
	const TitleBar = component.getUtility("uesio/io.titlebar")
	const { context, namespace, value, setValue } = props
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const [metadata] = api.builder.useMetadataList(context, "LABEL", namespace)

	const labelsWire = context.getWire("labels")
	const labelsData = labelsWire?.getData()

	if (!metadata || !labelsData) return null

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

	const tmpValue = (namespaceValues as Record<string, wire.FieldValue>) || {}
	const keys = Object.keys(metadata)
	const mapValue = keys
		? {
				...keys.reduce((obj, key) => ({ ...obj, [key]: null }), {}),
				...tmpValue,
		  }
		: tmpValue

	const listValue = Object.keys(mapValue).map((key) => ({
		key,
		displayLabel: getLabelValue(labelsData, key),
		value: mapValue[key],
	}))

	const setValueWrapper = (value: wire.PlainWireRecord) =>
		setValue({
			...nonNamespaceValues,
			...value,
		})

	return (
		<div className={classes.root}>
			<TitleBar title={namespace} context={context} />
			<ListField
				value={listValue}
				noAdd={true}
				noDelete={true}
				subType="STRUCT"
				subFields={{
					key: {
						name: "key",
						label: "Name",
						updateable: false,
					},
					displayLabel: {
						name: "displayLabel",
						label: "Value",
						updateable: false,
					},
					value: {
						name: "value",
						label: "Translation",
					},
				}}
				setValue={(value: wire.PlainWireRecord[]) => {
					setValueWrapper(
						value.reduce((obj, record) => {
							const key = record.key as string
							const value = record.value as string
							if (value || value === "") {
								obj[key] = value
							}
							return obj
						}, {})
					)
				}}
				mode={"EDIT"}
				context={context}
			/>
		</div>
	)
}

export default TranslationItem
