import { definition, api, context, collection } from "@uesio/ui"
import { useState } from "react"
import { FullPath } from "../../../../api/path"
import ActionButton from "../../../../helpers/actionbutton"
import PropertiesWrapper from "../propertieswrapper"
import FieldSelectPropTag from "./fieldselectproptag"

type Props = {
	allowMultiselect?: boolean
	allowReferenceTraversal?: boolean
	baseCollectionKey: string
	isSelected: (
		ctx: context.Context,
		path: FullPath,
		fieldId: string
	) => boolean
	onClose: () => void
	onSelect?: (ctx: context.Context, path: FullPath) => void
	onUnselect?: (ctx: context.Context, path: FullPath) => void
}

const extractPickerContext = (
	path: FullPath,
	collectionKey: string,
	contextField?: collection.Field
): [string, collection.Field?] => {
	if (path.size() < 2) return [collectionKey, contextField]
	const [currentField, pathWithoutFieldName] = path.shift()
	const [, nextPath] = pathWithoutFieldName.shift()

	if (!currentField) return [collectionKey, contextField]
	const metadata = api.collection.getCollection(collectionKey)
	const fieldMetadata = metadata?.getField(currentField)

	if (fieldMetadata) {
		// If this is a Reference field, we need to keep traversing the path to get the collection key
		if (fieldMetadata.isReference()) {
			const referenceMetadata = fieldMetadata.getReferenceMetadata()
			if (!referenceMetadata) return [collectionKey, contextField]
			return extractPickerContext(
				nextPath,
				referenceMetadata.collection,
				fieldMetadata
			)
		} else if (
			fieldMetadata.getType() === "STRUCT" &&
			fieldMetadata.hasSubFields()
		) {
			// If this is a Struct field, we need to keep traversing the path to get the context struct field
			return extractPickerContext(nextPath, collectionKey, fieldMetadata)
		}
	}

	return [collectionKey, contextField]
}

const sortFields = (
	a: collection.Field,
	b: collection.Field,
	localNamespace: string
) => {
	// First sort by local vs managed
	const aIsLocal = a.getNamespace() === localNamespace
	const bIsLocal = b.getNamespace() === localNamespace
	if (aIsLocal && !bIsLocal) return -1
	if (!aIsLocal && bIsLocal) return 1
	// Then sort by label
	return (a.getLabel() || a.getName()).localeCompare(
		b.getLabel() || b.getName()
	)
}

const FieldPicker: definition.UtilityComponent<Props> = (props) => {
	const {
		allowMultiselect = false,
		allowReferenceTraversal = true,
		context,
		baseCollectionKey,
		onClose,
		onSelect,
		onUnselect,
		isSelected,
	} = props

	const path = new FullPath()
	const [referencePath, setReferencePath] = useState<FullPath>(path)
	const [searchTerm, setSearchTerm] = useState("")

	// Get the collection key from the referencePath
	const [collectionKey, parentFieldMetadata] = extractPickerContext(
		referencePath,
		baseCollectionKey
	)

	const collectionMetadata = api.collection.useCollection(
		context,
		collectionKey,
		{
			needAllFieldMetadata: true,
		}
	)

	const workspace = context.getWorkspace()
	if (!collectionMetadata || !workspace) return null
	const localNamespace = workspace?.app || ""

	let displayFields: collection.Field[]

	if (
		parentFieldMetadata &&
		parentFieldMetadata.getType() === "STRUCT" &&
		parentFieldMetadata.hasSubFields()
	) {
		displayFields = Object.values(
			parentFieldMetadata.getSubFields() || {}
		).map((field) => new collection.Field(field))
	} else {
		displayFields = collectionMetadata.getFields()
	}

	// Sort the collection fields such that the LOCAL fields are first, then all managed fields
	displayFields.sort((a, b) => sortFields(a, b, localNamespace))

	return (
		<PropertiesWrapper
			context={props.context}
			className={props.className}
			path={referencePath}
			title={`Select Field${
				allowMultiselect ? "s" : ""
			} (${collectionMetadata.getId()})`}
			onUnselect={onClose}
			searchTerm={searchTerm}
			setSearchTerm={setSearchTerm}
			searchAreaActions={
				referencePath.size() > path.size() && (
					<ActionButton
						title="Go Back"
						icon={"arrow_back"}
						onClick={(e) => {
							e.stopPropagation()
							setReferencePath(referencePath.parent().parent())
						}}
						context={context}
					/>
				)
			}
		>
			{displayFields.map((fieldMetadata: collection.Field) => {
				const fieldId = fieldMetadata.getId()
				const selected = isSelected(context, referencePath, fieldId)
				if (searchTerm && !fieldId.includes(searchTerm)) return null
				return (
					<FieldSelectPropTag
						allowReferenceTraversal={allowReferenceTraversal}
						setReferencePath={setReferencePath}
						selected={selected}
						path={referencePath?.addLocal(fieldId)}
						fieldMetadata={fieldMetadata}
						key={fieldId}
						context={context}
						onSelect={(ctx: context.Context, path: FullPath) => {
							onSelect?.(ctx, path)
							// For NON-multi-select field pickers, we want to go ahead and close the picker after selection
							if (!allowMultiselect) {
								onClose()
							}
						}}
						onUnselect={onUnselect}
					/>
				)
			})}
		</PropertiesWrapper>
	)
}

FieldPicker.displayName = "FieldPicker"

export default FieldPicker
