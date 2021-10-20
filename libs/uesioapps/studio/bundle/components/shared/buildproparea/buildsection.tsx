import { FunctionComponent, ComponentType } from "react"
import { builder } from "@uesio/ui"
import PropListSection from "./proplistsection"
import FieldsSection from "./fieldssection"
import ConditionsSection from "./conditionssection"
import SignalsSection from "./signalssection"
import StylesSection from "./stylessection"
import { SectionRendererProps } from "./sectionrendererdefinition"
import OrderSection from "./ordersection"

const SECTION_TO_COMPONENT: {
	[K in builder.PropertySection["type"]]: ComponentType<SectionRendererProps>
} = {
	FIELDS: FieldsSection,
	CONDITIONS: ConditionsSection,
	SIGNALS: SignalsSection,
	PROPLIST: PropListSection,
	STYLES: StylesSection,
	ORDER: OrderSection,
}

const BuildSection: FunctionComponent<SectionRendererProps> = (props) => {
	const SectionHandler = SECTION_TO_COMPONENT[props.section.type]
	return <SectionHandler {...props} />
}

export default BuildSection
