import { FunctionComponent } from "react"
import { definition, component, hooks, metadata, collection } from "@uesio/ui"

interface MetadataPickerProps extends definition.UtilityProps {
	value: string
	setValue: (value: string) => void
	metadataType: metadata.MetadataType
	label: string
	labelPosition?: string
	grouping?: string
	defaultNamespace?: string
	selectVariant?: string
	fieldWrapperVariant?: string
}

const Grid = component.registry.getUtility("uesio/io.grid")
const SelectField = component.registry.getUtility("uesio/io.selectfield")
const FieldWrapper = component.registry.getUtility("uesio/io.fieldwrapper")

const addBlankSelectOption = collection.addBlankSelectOption

const MetadataPicker: FunctionComponent<MetadataPickerProps> = (props) => {
	const {
		value,
		setValue,
		label,
		labelPosition,
		metadataType,
		context,
		grouping,
		defaultNamespace,
		selectVariant,
		fieldWrapperVariant,
	} = props
	const uesio = hooks.useUesio(props)

	if (!context.getWorkspace() && !context.getSiteAdmin()) {
		return <div>Must provide either siteadmin or workspace context</div>
	}

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

	return (
		<FieldWrapper
			labelPosition={labelPosition}
			variant={fieldWrapperVariant}
			label={label}
			context={context}
		>
			<Grid
				context={context}
				styles={{
					root: {
						gridTemplateColumns: defaultNamespace
							? "1fr"
							: "1fr 1fr",
						columnGap: "10px",
					},
				}}
			>
				{!defaultNamespace && (
					<SelectField
						context={context}
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
						variant={selectVariant}
					/>
				)}

				<SelectField
					context={context}
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
					variant={selectVariant}
				/>
			</Grid>
		</FieldWrapper>
	)
}

MetadataPicker.displayName = "MetadataPicker"

export default MetadataPicker
