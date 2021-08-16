import { definition, builder } from "@uesio/ui"

type DialogDefinition = {
	id: string
	title?: string
	width?: string
	height?: string
} & definition.BaseDefinition

interface DialogProps extends definition.BaseProps {
	definition: DialogDefinition
}

const DialogPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Dialog",
	defaultDefinition: () => ({
		id: "newDialog",
		title: "New Dialog",
		width: "400px",
		height: "500px",
	}),
	properties: [
		{
			name: "id",
			type: "TEXT",
			label: "Id",
		},
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
	type: "component",
	classes: ["root"],
	traits: ["uesio.standalone"],
}
export { DialogProps, DialogDefinition }

export default DialogPropertyDefinition
