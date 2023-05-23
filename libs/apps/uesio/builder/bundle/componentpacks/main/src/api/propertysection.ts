import { definition } from "@uesio/ui"

type PropertyPanelSectionType =
	| "HOME"
	| "DISPLAY"
	| "STYLES"
	| "SIGNALS"
	| "CUSTOM"

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
	properties: string[]
}

interface CustomSection extends BaseSection {
	label: string
	id?: string
	icon?: string
	viewDefinition?: definition.DefinitionList
	properties?: string[]
	type?: "CUSTOM"
}

interface DisplaySection extends BaseSection {
	id: "uesio.display"
	label: "Display"
	type: "DISPLAY"
}

interface StylesSection extends BaseSection {
	id: "uesio.styleTokens"
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

const HOME_LABEL = ""
const HOME_TYPE = "HOME"
const HOME_ID = "uesio.home"
const HOME_ICON = "home"

const STYLES_LABEL = "Styles"
const STYLES_TYPE = "STYLES"
const STYLES_ID = "uesio.styleTokens"

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
	s.type === STYLES_TYPE
const isDisplaySection = (s: PropertiesPanelSection): s is DisplaySection =>
	s.type === "DISPLAY"
const isCustomSection = (s: PropertiesPanelSection): s is CustomSection =>
	!s.type || s.type === "CUSTOM"

const getSectionId = (s: PropertiesPanelSection): string => {
	switch (s.type) {
		case HOME_TYPE:
			return s.id || HOME_ID
		case STYLES_TYPE:
			return s.id || "uesio.styleTokens"
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
		case HOME_TYPE:
			return HOME_LABEL
		case STYLES_TYPE:
			return STYLES_LABEL
		case "DISPLAY":
			return DISPLAY_SECTION.label
		case "SIGNALS":
			return s.label === undefined ? "Signals" : s.label
		default:
			return s.label === undefined ? getSectionId(s) : s.label
	}
}

const getSectionIcon = (s: PropertiesPanelSection): string => {
	switch (s.type) {
		case HOME_TYPE:
			return HOME_ICON
		default:
			return s.icon || ""
	}
}

const getHomeSection = (propertyIds: string[]) =>
	({
		id: HOME_ID,
		label: HOME_LABEL,
		type: HOME_TYPE,
		icon: HOME_ICON,
		properties: propertyIds,
	} as HomeSection)

export {
	DISPLAY_SECTION,
	isCustomSection,
	isStylesSection,
	isDisplaySection,
	getSectionId,
	getSectionLabel,
	getSectionIcon,
	getStylesSection,
	getHomeSection,
}

export type {
	StylesSection,
	CustomSection,
	HomeSection,
	DisplaySection,
	SignalsSection,
	PropertiesPanelSection,
}
