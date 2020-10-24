import React, { ReactElement } from "react"
import { definition, builder } from "@uesio/ui"
import PropListSection from "./proplistsection"
import FieldsSection from "./fieldssection"
import ConditionsSection from "./conditionssection"
import SignalsSection from "./signalssection"

interface Props extends definition.BaseProps {
	section: builder.PropertySection
	definition: definition.DefinitionMap
}

function getSectionHandler(type?: string) {
	switch (type) {
		case "FIELDS":
			return FieldsSection
		case "CONDITIONS":
			return ConditionsSection
		case "SIGNALS":
			return SignalsSection
		default:
			return PropListSection
	}
}

function BuildSection(props: Props): ReactElement | null {
	const section = props.section
	const SectionHandler = getSectionHandler(section.type)

	return (
		<SectionHandler
			{...{
				section,
				path: props.path,
				definition: props.definition,
				context: props.context,
			}}
		/>
	)
}

export default BuildSection
