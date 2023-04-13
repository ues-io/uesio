import { definition, api, wire } from "@uesio/ui"
import { useState } from "react"
import { get } from "../../../../api/defapi"
import { FullPath } from "../../../../api/path"
import ActionButton from "../../../../helpers/actionbutton"
import PropertiesWrapper from "../propertieswrapper"
import FieldSelectPropTag from "./fieldselectproptag"

type Props = {
	baseCollectionKey: string
	path: FullPath
	onClose: () => void
}

const getNextCollectionKey = (
	path: FullPath,
	collectionKey: string
): string => {
	if (path.size() < 4) return collectionKey
	// Get the first field from the path
	const basePath = path.trimToSize(3)
	const [, pathWithoutWires] = path.shift()
	const [, pathWithoutWireName] = pathWithoutWires.shift()
	const [, pathWithoutFieldsNode] = pathWithoutWireName.shift()
	const [currentField, pathWithoutFieldName] = pathWithoutFieldsNode.shift()
	const [, nextPath] = pathWithoutFieldName.shift()

	if (!currentField) return collectionKey
	const metadata = api.collection.getCollection(collectionKey)
	const fieldMetadata = metadata?.getField(currentField)

	if (!fieldMetadata || !fieldMetadata.isReference()) return collectionKey
	const referenceMetadata = fieldMetadata.getReferenceMetadata()
	if (!referenceMetadata) return collectionKey

	return getNextCollectionKey(
		basePath.merge(nextPath),
		referenceMetadata.collection
	)
}

const FieldPicker: definition.UtilityComponent<Props> = (props) => {
	const { context, baseCollectionKey, path, onClose } = props

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

	const fieldsDef = get(context, referencePath) as wire.WireFieldDefinitionMap

	if (!collectionFields || !collectionMetadata) return null

	return (
		<PropertiesWrapper
			context={props.context}
			className={props.className}
			path={referencePath}
			title={"Select Fields: " + collectionMetadata.getId()}
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
			{Object.keys(collectionFields).map((fieldId) => {
				const selected = fieldsDef?.[fieldId] !== undefined
				const fieldMetadata = collectionMetadata.getField(fieldId)
				if (!fieldMetadata) return null
				if (searchTerm && !fieldId.includes(searchTerm)) return null
				return (
					<FieldSelectPropTag
						setReferencePath={setReferencePath}
						selected={selected}
						path={referencePath.addLocal(fieldId)}
						fieldMetadata={fieldMetadata}
						key={fieldId}
						context={context}
					/>
				)
			})}
		</PropertiesWrapper>
	)
}

FieldPicker.displayName = "FieldPicker"

export default FieldPicker
