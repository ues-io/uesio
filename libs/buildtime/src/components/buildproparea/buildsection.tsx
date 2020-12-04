import React, { FunctionComponent } from "react"
import { definition, builder } from "@uesio/ui"
import PropListSection from "./proplistsection"
import FieldsSection from "./fieldssection"
import ConditionsSection from "./conditionssection"
import SignalsSection from "./signalssection"

interface Props extends definition.BaseProps {
	section: builder.PropertySection
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

const BuildSection: FunctionComponent<Props> = (props) => {
	const { section, context, path, definition } = props
	const SectionHandler = getSectionHandler(section.type)

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
