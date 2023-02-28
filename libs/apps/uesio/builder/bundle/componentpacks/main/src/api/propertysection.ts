import { definition } from "@uesio/ui"

type PropertyPanelSectionType =
	| "HOME"
	| "DISPLAY"
	| "STYLES"
	| "SIGNALS"
	| "CUSTOM"
	| "LIST"

interface BaseSection {
	id?: string
	label?: string
	type?: PropertyPanelSectionType
	icon?: string
}

interface HomeSection extends BaseSection {
	id: "uesio.home"
	label: ""
	icon: "home"
	type: "HOME"
}

interface CustomSection extends BaseSection {
	label: string
	id?: string
	icon?: string
	viewDefinition: definition.DefinitionList
	type?: "CUSTOM"
}

interface DisplaySection extends BaseSection {
	id: "uesio.display"
	label: "Display"
	type: "DISPLAY"
}

interface StylesSection extends BaseSection {
	id: "uesio.styles"
	label: "Styles"
	type: "STYLES"
	componentType: string
}

interface SignalsSection extends BaseSection {
	type: "SIGNALS"
	id?: string
	label?: string
}

type PropertiesPanelSection =
	| HomeSection
	| SignalsSection
	| CustomSection
	| DisplaySection
	| StylesSection

const HOME_SECTION: HomeSection = {
	id: "uesio.home",
	label: "",
	icon: "home",
	type: "HOME",
}

const STYLES_LABEL = "Styles"
const STYLES_TYPE = "STYLES"
const STYLES_ID = "uesio.styles"

const getStylesSection = (componentType: string): StylesSection => ({
	id: STYLES_ID,
	label: STYLES_LABEL,
	type: STYLES_TYPE,
	icon: "",
	componentType,
})

const DISPLAY_SECTION: DisplaySection = {
	id: "uesio.display",
	label: "Display",
	type: "DISPLAY",
	icon: "",
}

const isStylesSection = (s: PropertiesPanelSection): s is StylesSection =>
	s.type === "STYLES"
const isDisplaySection = (s: PropertiesPanelSection): s is DisplaySection =>
	s.type === "DISPLAY"
const isCustomSection = (s: PropertiesPanelSection): s is CustomSection =>
	!s.type || s.type === "CUSTOM"

const getSectionId = (s: PropertiesPanelSection): string => {
	switch (s.type) {
		case "HOME":
			return s.id || "uesio.home"
		case "STYLES":
			return s.id || "uesio.styles"
		case "DISPLAY":
			return s.id || "uesio.display"
		case "SIGNALS":
			return s.id || "signals"
		default:
			return s.id || s.label || ""
	}
}

const getSectionLabel = (s: PropertiesPanelSection): string => {
	switch (s.type) {
		case "HOME":
			return HOME_SECTION.label
		case "STYLES":
			return STYLES_LABEL
		case "DISPLAY":
			return DISPLAY_SECTION.label
		case "SIGNALS":
			return s.label || "Signals"
		default:
			return s.label || s.id || ""
	}
}

const getSectionIcon = (s: PropertiesPanelSection): string => {
	switch (s.type) {
		case "HOME":
			return HOME_SECTION.icon
		default:
			return s.icon || ""
	}
}

const getHomeSection = () => HOME_SECTION

export {
	HOME_SECTION,
	DISPLAY_SECTION,
	isCustomSection,
	isStylesSection,
	isDisplaySection,
	getSectionId,
	getSectionLabel,
	getSectionIcon,
	getStylesSection,
	getHomeSection,
	StylesSection,
	CustomSection,
	HomeSection,
	DisplaySection,
	SignalsSection,
	PropertiesPanelSection,
}
