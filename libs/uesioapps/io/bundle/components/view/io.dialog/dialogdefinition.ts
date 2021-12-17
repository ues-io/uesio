import { definition, builder } from "@uesio/ui"

type DialogDefinition = {
	title?: string
	width?: string
	height?: string
}

interface DialogProps extends definition.BaseProps {
	definition: DialogDefinition
}

const DialogPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Dialog",
	defaultDefinition: () => ({
		title: "New Dialog",
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
export { DialogProps, DialogDefinition }

export default DialogPropertyDefinition
