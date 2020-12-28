import React, { FunctionComponent, ComponentType } from "react"
import { definition, builder } from "@uesio/ui"
import PropListSection from "./proplistsection"
import FieldsSection from "./fieldssection"
import ConditionsSection from "./conditionssection"
import SignalsSection from "./signalssection"

interface Props extends definition.BaseProps {
	section: builder.PropertySection
}

const SECTION_TO_COMPONENT: {
	[K in builder.PropertySection["type"]]: ComponentType<Props>
} = {
	FIELDS: FieldsSection,
	CONDITIONS: ConditionsSection,
	SIGNALS: SignalsSection,
	PROPLIST: PropListSection,
}

const BuildSection: FunctionComponent<Props> = ({
	section,
	context,
	path,
	definition,
}) => {
	const SectionHandler = SECTION_TO_COMPONENT[section.type]
	return (
		<SectionHandler
			section={section}
			path={path}
			definition={definition}
			context={context}
		/>
	)
}

export default BuildSection
