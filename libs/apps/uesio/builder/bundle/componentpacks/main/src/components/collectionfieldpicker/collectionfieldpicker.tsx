import { definition, component, context, metadata, styles } from "@uesio/ui"
import FieldPicker from "../mainwrapper/propertiespanel/wire/fieldpicker"
import { useRef, useState } from "react"
import { FullPath } from "../../api/path"

type ComponentDefinition = {
	/**
	 * The field on the properties wire which will contain the selected collection field
	 */
	fieldId: string
	label: string
	labelPosition?: string
	/**
	 * The field on the properties wire which contains the collection to use for the field picker
	 */
	collectionField?: string
	/** An explicit collection name to use for the field picker */
	collectionName?: string
	namespace?: string
	fieldWrapperVariant?: metadata.MetadataKey
}

const StyleDefaults = Object.freeze({
	root: ["grid", "grid-cols-[1fr_max-content]", "gap-1"],
	button: ["p-1"],
})

/**
 * Converts the Field Picker FullPath of a selected field to a field selector, e.g. "uesio/core.owner->uesio/core.firstname")
 * @param path FullPath
 * @returns string
 */
const transformFieldPickerPath = (path: FullPath) =>
	component.path
		.toPath(path.localPath)
		.filter((x) => x !== "fields")
		.join("->")

const CollectionFieldPicker: definition.UC<ComponentDefinition> = (props) => {
	const {
		context,
		definition: {
			fieldId,
			fieldWrapperVariant,
			labelPosition,
			collectionName,
			collectionField,
		},
	} = props

	const classes = styles.useStyleTokens(StyleDefaults, props)

	const collectionKey = collectionField
		? context.getRecord()?.getFieldValue<string>(collectionField)
		: context.mergeString(collectionName)
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	const IconButton = component.getUtility("uesio/io.iconbutton")
	const TextField = component.getUtility("uesio/io.textfield")
	const Popper = component.getUtility("uesio/io.popper")
	const anchorEl = useRef<HTMLDivElement>(null)
	const [showPopper, setShowPopper] = useState(false)
	const record = context.getRecord()
	// The current collection name
	const value = record?.getFieldValue<string>(fieldId)
	// The type of field that we are populating with the collection name
	const fieldMetadata = record?.getWire().getCollection().getField(fieldId)
	const onSelect = (ctx: context.Context, path: FullPath) => {
		record?.update(fieldId, transformFieldPickerPath(path), ctx)
	}
	const isSelected = (
		ctx: context.Context,
		path: FullPath,
		fieldId: string
	) => {
		const selectedField = transformFieldPickerPath(path.addLocal(fieldId))
		if (!value) return false
		return selectedField === value || value.startsWith(selectedField)
	}

	return (
		<>
			{showPopper && anchorEl && (
				<Popper
					referenceEl={anchorEl.current}
					context={context}
					placement="right-start"
					autoPlacement={["right-start"]}
					offset={6}
					useFirstRelativeParent
					matchHeight
				>
					<FieldPicker
						context={context}
						baseCollectionKey={collectionKey || ""}
						onClose={() => setShowPopper(false)}
						onSelect={onSelect}
						allowMultiselect={false}
						isSelected={isSelected}
					/>
				</Popper>
			)}
			<FieldWrapper
				ref={anchorEl}
				label={fieldMetadata?.getLabel()}
				labelPosition={labelPosition}
				context={context}
				variant={fieldWrapperVariant}
			>
				<div className={classes.root}>
					<TextField
						mode="READ"
						value={value}
						label={fieldMetadata?.getLabel()}
						context={context}
						variant="uesio/builder.propfield"
					/>
					<IconButton
						onClick={() => {
							setShowPopper(true)
						}}
						icon="edit"
						context={context}
						label="Select Field"
						tooltipPlacement={"bottom-start"}
						className={classes.button}
					/>
				</div>
			</FieldWrapper>
		</>
	)
}

export default CollectionFieldPicker
