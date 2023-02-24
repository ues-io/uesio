import { FunctionComponent, ComponentType } from "react"

import PropListSection from "./proplistsection"
import PropListsSection from "./proplistssection"
import ConditionsSection from "./conditionssection"
import ConditionalDisplaySection from "./displayconditions/displaysection"
import StylesSection from "./stylessection"
import { SectionRendererProps } from "./sectionrendererdefinition"

const SECTION_TO_COMPONENT: {
	[key: string]: ComponentType<SectionRendererProps>
} = {
	CONDITIONS: ConditionsSection,
	PROPLIST: PropListSection,
	PROPLISTS: PropListsSection,
	STYLES: StylesSection,
	CONDITIONALDISPLAY: ConditionalDisplaySection,
}

const BuildSection: FunctionComponent<SectionRendererProps> = (props) => {
	const SectionHandler =
		props.section.type === "CUSTOM"
			? props.section.renderFunc
			: SECTION_TO_COMPONENT[props.section.type]
	return <SectionHandler {...props} />
}

export default BuildSection
