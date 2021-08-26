import { definition, builder, signal } from "@uesio/ui"

type DialogDefinition = {
	text?: string
	signals?: signal.SignalDefinition[]
}

interface DialogProps extends definition.BaseProps {
	definition: DialogDefinition
}

const DialogPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Dialog",
	defaultDefinition: () => ({
		text: "New Dialog",
	}),
	properties: [
		{
			name: "text",
			type: "TEXT",
			label: "Text",
		},
		{
			name: "id",
			type: "TEXT",
			label: "ID",
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
	sections: [
		{
			title: "Signals",
			type: "SIGNALS",
		},
	],
	actions: [
		{
			label: "Run Signals",
			type: "RUN_SIGNALS",
			slot: "signals",
		},
	],
	traits: ["uesio.standalone", "uesio.panel"],
	classes: ["root"],
	type: "component",
}
export { DialogProps, DialogDefinition }

export default DialogPropertyDefinition
