import { definition, component, context, metadata, styles } from "@uesio/ui"
import FieldPicker from "../mainwrapper/propertiespanel/wire/fieldpicker"
import { useRef, useState } from "react"
import { FullPath } from "../../api/path"

type CollectionFieldDefinition = {
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

const CollectionField: definition.UC<CollectionFieldDefinition> = (props) => {
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
	// const namespace = context.mergeString(props.definition.namespace)

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
		const selectedField = component.path
			.toPath(path.localPath)
			.filter((x) => x !== "fields")
			.join("->")
		console.log("local path selected was: " + selectedField)
		record?.update(fieldId, selectedField, ctx)
	}
	const path = new FullPath(undefined, undefined, value)

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
						path={path}
						baseCollectionKey={collectionKey || ""}
						onClose={() => setShowPopper(false)}
						onSelect={onSelect}
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

export default CollectionField
