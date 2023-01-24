import { FunctionComponent, ComponentType } from "react"

import PropListSection from "./proplistsection"
import PropListsSection from "./proplistssection"
import ConditionsSection from "./conditionssection"
import SignalsSection from "./signalssection"
import ConditionalDisplaySection from "./displayconditions/displaysection"
import StylesSection from "./stylessection"
import { SectionRendererProps } from "./sectionrendererdefinition"
import OrderSection from "./ordersection"

const SECTION_TO_COMPONENT: {
	[key: string]: ComponentType<SectionRendererProps>
} = {
	CONDITIONS: ConditionsSection,
	SIGNALS: SignalsSection,
	PROPLIST: PropListSection,
	PROPLISTS: PropListsSection,
	STYLES: StylesSection,
	CONDITIONALDISPLAY: ConditionalDisplaySection,
	ORDER: OrderSection,
}

const BuildSection: FunctionComponent<SectionRendererProps> = (props) => {
	const SectionHandler =
		props.section.type === "CUSTOM"
			? props.section.renderFunc
			: SECTION_TO_COMPONENT[props.section.type]
	return <SectionHandler {...props} />
}

export default BuildSection
