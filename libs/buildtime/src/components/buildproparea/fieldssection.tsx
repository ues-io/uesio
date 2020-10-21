import React, { ReactElement, useEffect } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../toolbar/expandpanel/expandpanel"
import { hooks, material, component, definition } from "@uesio/ui"
import PropNodeTag from "../buildpropitem/propnodetag"
import CheckBoxOutlineBlank from "@material-ui/icons/CheckBoxOutlineBlank"
import CheckBox from "@material-ui/icons/CheckBox"

function FieldsSection(props: SectionRendererProps): ReactElement | null {
	const section = props.section
	const def = props.definition
	const collectionKey = def?.collection as string | undefined

	if (!collectionKey) {
		return null
	}

	// Limit the fields to just the same namespace as the collection for now.
	// In theory, you could have fields from a different namespace attached to
	// this collection.
	const [namespace] = component.path.parseKey(collectionKey)

	const uesio = hooks.useUesio(props)
	const theme = material.useTheme()
	const fields = uesio.builder.useMetadataList(
		"FIELD",
		namespace,
		collectionKey
	)

	useEffect(() => {
		if (!fields) {
			uesio.builder.getMetadataList(
				props.context,
				"FIELD",
				namespace,
				collectionKey
			)
			return
		}
	})

	const fieldsDef = def?.fields as definition.DefinitionMap

	const onDragStart = (e: React.DragEvent) => {
		const target = e.target as HTMLDivElement
		if (target && target.dataset.type) {
			uesio.builder.setDragNode(target.dataset.type)
		}
	}
	const onDragEnd = () => {
		uesio.builder.setDragNode("")
		uesio.builder.setDropNode("")
	}

	return (
		<ExpandPanel defaultExpanded={false} title={section.title}>
			<div onDragStart={onDragStart} onDragEnd={onDragEnd}>
				{fields &&
					collectionKey &&
					Object.keys(fields).map((fieldId, index) => {
						const fieldDef = fieldsDef?.[fieldId]
						const selected = fieldDef !== undefined
						return (
							<PropNodeTag
								draggable={component.dragdrop.createFieldBankKey(
									collectionKey,
									fieldId
								)}
								title={fieldId}
								icon={
									selected ? CheckBox : CheckBoxOutlineBlank
								}
								iconColor={
									selected
										? theme.palette.primary.main
										: undefined
								}
								key={index}
								onClick={(): void => {
									if (selected) {
										uesio.view.removeDefinition(
											`${props.path}["fields"]["${fieldId}"]`
										)
									} else {
										uesio.view.addDefinitionPair(
											`${props.path}["fields"]`,
											null,
											fieldId
										)
									}
								}}
								selected={selected}
							></PropNodeTag>
						)
					})}
			</div>
		</ExpandPanel>
	)
}

export default FieldsSection
