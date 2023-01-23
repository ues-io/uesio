import { definition, api, wire } from "@uesio/ui"
import { get } from "../../../../api/defapi"
import { FullPath } from "../../../../api/path"
import PropertiesWrapper from "../propertieswrapper"
import FieldSelectPropTag from "./fieldselectproptag"

type Props = {
	collectionKey: string
	path: FullPath
	onClose: () => void
}

const FieldPicker: definition.UtilityComponent<Props> = (props) => {
	const { context, collectionKey, path, onClose } = props

	const [collectionFields] = api.builder.useMetadataList(
		context,
		"FIELD",
		"",
		collectionKey
	)

	const fieldsDef = get(context, path) as wire.WireFieldDefinitionMap

	if (!collectionFields) return null

	return (
		<PropertiesWrapper
			context={props.context}
			className={props.className}
			path={path}
			title={"Select Fields"}
			onUnselect={onClose}
		>
			{Object.keys(collectionFields).map((fieldId) => {
				const selected = fieldsDef[fieldId] !== undefined
				return (
					<FieldSelectPropTag
						collectionKey={collectionKey}
						selected={selected}
						path={path.addLocal(fieldId)}
						fieldId={fieldId}
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
