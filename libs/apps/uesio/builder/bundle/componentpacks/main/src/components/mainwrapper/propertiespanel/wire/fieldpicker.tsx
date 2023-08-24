import { definition, api, context } from "@uesio/ui"
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

const getNextCollectionKey = (
	path: FullPath,
	collectionKey: string
): string => {
	if (path.size() < 2) return collectionKey
	const [currentField, pathWithoutFieldName] = path.shift()
	const [, nextPath] = pathWithoutFieldName.shift()

	if (!currentField) return collectionKey
	const metadata = api.collection.getCollection(collectionKey)
	const fieldMetadata = metadata?.getField(currentField)

	if (!fieldMetadata || !fieldMetadata.isReference()) return collectionKey
	const referenceMetadata = fieldMetadata.getReferenceMetadata()
	if (!referenceMetadata) return collectionKey

	return getNextCollectionKey(nextPath, referenceMetadata.collection)
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
	const collectionKey = getNextCollectionKey(referencePath, baseCollectionKey)

	const [collectionFields] = api.builder.useMetadataList(
		context,
		"FIELD",
		"",
		collectionKey
	)

	const collectionMetadata = api.collection.useCollection(
		context,
		collectionKey,
		{
			needAllFieldMetadata: true,
		}
	)

	if (!collectionFields || !collectionMetadata) return null

	const localNamespace = context.getWorkspace()?.app

	// Sort the collection fields such that the LOCAL fields are first, then all managed fields
	const sortedFields = Object.values(collectionFields)
	sortedFields.sort((a, b) => {
		// First sort by local vs managed
		const aIsLocal = a.namespace === localNamespace
		const bIsLocal = b.namespace === localNamespace
		if (aIsLocal && !bIsLocal) return -1
		if (!aIsLocal && bIsLocal) return 1
		// Then sort by name
		return a.key.localeCompare(b.key)
	})

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
			{sortedFields.map((metadataInfo) => {
				const fieldId = metadataInfo.key
				const fieldMetadata = collectionMetadata.getField(fieldId)
				if (!fieldMetadata) return null
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
