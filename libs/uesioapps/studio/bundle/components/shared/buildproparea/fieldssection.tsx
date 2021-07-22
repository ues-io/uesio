import { FunctionComponent, DragEvent } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import { hooks, component, definition } from "@uesio/ui"
import PropNodeTag from "../buildpropitem/propnodetag"

const FieldsSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { section, path, context, valueAPI } = props
	const wireDef = valueAPI.get(path) as definition.DefinitionMap | undefined
	const collectionKey = wireDef?.collection as string | undefined

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

	const fieldsDef = wireDef?.fields as definition.DefinitionMap
	const isStructureView = uesio.builder.useIsStructureView()

	const onDragStart = (e: DragEvent) => {
		const target = e.target as HTMLDivElement
		if (target && target.dataset.type && isStructureView) {
			uesio.builder.setDragNode("field", "", target.dataset.type)
		}
	}
	const onDragEnd = () => {
		uesio.builder.clearDragNode()
		uesio.builder.clearDropNode()
	}

	return (
		<ExpandPanel
			defaultExpanded={false}
			title={section.title}
			context={context}
		>
			<div onDragStart={onDragStart} onDragEnd={onDragEnd}>
				{fields &&
					collectionKey &&
					Object.keys(fields).map((fieldId, index) => {
						const fieldDef = fieldsDef?.[fieldId]
						const selected = fieldDef !== undefined
						const onClick = (): void =>
							selected
								? valueAPI.remove(
										`${path}["fields"]["${fieldId}"]`
								  )
								: valueAPI.addPair(
										`${path}["fields"]`,
										null,
										fieldId
								  )
						return (
							<PropNodeTag
								draggable={`${collectionKey}.${fieldId}`}
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
