import { definition, builder } from "@uesio/ui"

type PopupDefinition = {
	title?: string
	width?: string
	height?: string
}

interface PopupProps extends definition.BaseProps {
	definition: PopupDefinition
}

const PopupPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Popup",
	defaultDefinition: () => ({
		title: "New Popup",
	}),
	properties: [
		{
			name: "title",
			type: "TEXT",
			label: "Title",
		},
		{
			name: "width",
			type: "TEXT",
			label: "Width",
		},
		{
			name: "height",
			type: "TEXT",
			label: "Height",
		},
	],
	sections: [],
	actions: [],
	traits: ["uesio.panel"],
	classes: ["root"],
	type: "component",
}
export { PopupProps, PopupDefinition }

export default PopupPropertyDefinition
