import { definition, builder, signal } from "@uesio/ui"

type DialogDefinition = {
	id: string
	mode: "OPEN" | "CLOSE"
	title: string
	content: definition.DefinitionList
	agreeSignals?: signal.ComponentSignal[]
	disagreeSignals?: signal.ComponentSignal[]
}

interface DialogProps extends definition.BaseProps {
	definition: DialogDefinition
}

const DialogPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Dialog",
	defaultDefinition: () => ({}),
	sections: [
		{
			title: "Display",
			type: "PROPLIST",
			properties: [],
		},
	],
	traits: ["uesio.standalone"],
}
export { DialogProps, DialogDefinition }

export default DialogPropertyDefinition
