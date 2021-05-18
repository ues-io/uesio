import { FunctionComponent } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import { hooks, component, definition } from "@uesio/ui"
import PropNodeTag from "../buildpropitem/propnodetag"
import { getOnDragStartToolbar, getOnDragStopToolbar } from "../dragdrop"

const FieldsSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { section, definition: def, path, context } = props
	const collectionKey = def?.collection as string | undefined

	if (!collectionKey) {
		return null
	}

	// Limit the fields to just the same namespace as the collection for now.
	// In theory, you could have fields from a different namespace attached to
	// this collection.
	const [namespace] = component.path.parseKey(collectionKey)

	const uesio = hooks.useUesio(props)
	const theme = uesio.getTheme()
	const fields = uesio.builder.useMetadataList(
		context,
		"FIELD",
		namespace,
		collectionKey
	)

	const fieldsDef = def?.fields as definition.DefinitionMap

	const onDragStart = getOnDragStartToolbar(uesio)
	const onDragEnd = getOnDragStopToolbar(uesio)

	return (
		<ExpandPanel defaultExpanded={false} title={section.title}>
			<div onDragStart={onDragStart} onDragEnd={onDragEnd}>
				{fields &&
					collectionKey &&
					Object.keys(fields).map((fieldId, index) => {
						const fieldDef = fieldsDef?.[fieldId]
						const selected = fieldDef !== undefined
						const onClick = (): void =>
							selected
								? uesio.view.removeDefinition(
										`${path}["fields"]["${fieldId}"]`
								  )
								: uesio.view.addDefinitionPair(
										`${path}["fields"]`,
										null,
										fieldId
								  )
						return (
							<PropNodeTag
								draggable={component.dragdrop.createFieldBankKey(
									collectionKey,
									fieldId
								)}
								title={fieldId}
								icon={
									selected
										? "check_box"
										: "check_box_outline_blank"
								}
								iconColor={
									selected
										? theme.definition.palette.primary
										: undefined
								}
								key={index}
								onClick={onClick}
								selected={selected}
								context={context}
							/>
						)
					})}
			</div>
		</ExpandPanel>
	)
}

export default FieldsSection
