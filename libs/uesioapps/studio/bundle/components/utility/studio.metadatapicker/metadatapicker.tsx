import { FunctionComponent } from "react"
import { definition, component, hooks, metadata, collection } from "@uesio/ui"

interface MetadataPickerProps extends definition.UtilityProps {
	value: string
	setValue: (value: string) => void
	metadataType: metadata.MetadataType
	label: string
	grouping?: string
	defaultNamespace?: string
}

const Grid = component.registry.getUtility("io.grid")
const SelectField = component.registry.getUtility("io.selectfield")

const addBlankSelectOption = collection.addBlankSelectOption

const MetadataPicker: FunctionComponent<MetadataPickerProps> = (props) => {
	const {
		value,
		setValue,
		label,
		metadataType,
		context,
		grouping,
		defaultNamespace,
	} = props
	const uesio = hooks.useUesio(props)

	const namespaces = uesio.builder.useAvailableNamespaces(context)
	const [currentNamespace, name] = component.path.parseKey(value)
	const namespace = defaultNamespace || currentNamespace
	const metadata = uesio.builder.useMetadataList(
		context,
		metadataType,
		namespace,
		grouping
	)

	const getMetadataName = (key: string) => {
		if (metadataType === "COMPONENTVARIANT") {
			const [, , , name] = component.path.parseVariantKey(key)
			return name
		}
		const [, name] = component.path.parseKey(key)
		return name
	}

	const nbsp = "\u00A0"

	return (
		<Grid
			context={context}
			styles={{
				root: {
					gridTemplateColumns: defaultNamespace ? "1fr" : "1fr 1fr",
					columnGap: "10px",
				},
			}}
		>
			{!defaultNamespace && (
				<SelectField
					context={context}
					label={label}
					value={namespace}
					options={addBlankSelectOption(
						Object.keys(namespaces || {}).map((key) => ({
							value: key,
							label: key,
						}))
					)}
					setValue={(value: string) => {
						setValue(value ? `${value}.` : "")
					}}
				/>
			)}
			<SelectField
				context={context}
				label={defaultNamespace ? label : label && nbsp}
				value={name}
				options={addBlankSelectOption(
					Object.keys(metadata || {}).map((key) => {
						const name = getMetadataName(key)
						return {
							value: name,
							label: name,
						}
					})
				)}
				setValue={(value: string) => {
					setValue(`${namespace}.${value}`)
				}}
			/>
		</Grid>
	)
}

export default MetadataPicker
