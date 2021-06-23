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

	const nbsp = "\u00A0"

	const defaultProps = {
		context,
		label,
		value,
		setValue: (value: string) => setValue(value),
	}

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
					{...defaultProps}
					value={name}
					options={addBlankSelectOption(
						Object.keys(namespaces || {}).map((key) => ({
							value: `${key}.`,
							label: key,
						}))
					)}
				/>
			)}

			{metadataType === "COMPONENTVARIANT" ? (
				<SelectField
					{...defaultProps}
					label={nbsp}
					options={addBlankSelectOption(
						Object.keys(metadata || {}).map((key) => {
							// add to component.path.parseVariantKey
							const [
								,
								,
								namespace,
								name,
							] = component.path.parseVariantKey(key)
							return {
								value: `${namespace}.${name}`,
								label: name,
							}
						})
					)}
				/>
			) : (
				<SelectField
					{...defaultProps}
					label={defaultNamespace ? label : label && nbsp}
					options={addBlankSelectOption(
						Object.keys(metadata || {}).map((key) => {
							const [, name] = component.path.parseKey(key)
							return {
								value: `${namespace}.${value}`,
								label: name,
							}
						})
					)}
				/>
			)}
		</Grid>
	)
}

export default MetadataPicker
