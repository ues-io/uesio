import React, { FunctionComponent, useEffect } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../toolbar/expandpanel/expandpanel"
import { hooks, component, definition } from "@uesio/ui"
import PropNodeTag from "../buildpropitem/propnodetag"
import CheckBoxOutlineBlank from "@material-ui/icons/CheckBoxOutlineBlank"
import CheckBox from "@material-ui/icons/CheckBox"
import {
	getOnDragStartToolbar,
	getOnDragStopToolbar,
} from "../../utils/draganddrop"

const FieldsSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { section, definition: def, path } = props
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
		}
	})

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
									selected ? CheckBox : CheckBoxOutlineBlank
								}
								iconColor={
									selected
										? theme.definition.palette.primary
										: undefined
								}
								key={index}
								onClick={onClick}
								selected={selected}
							/>
						)
					})}
			</div>
		</ExpandPanel>
	)
}

export default FieldsSection
