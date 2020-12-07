import { definition, builder, signal } from "@uesio/ui"

type DialogMode = "OPEN" | "CLOSE"

type DialogState = {
	mode: DialogMode
}

type DialogDefinition = {
	id: string
	mode: DialogMode
	title: string
	content: definition.DefinitionList
	agreeSignals?: signal.SignalDefinition[]
	disagreeSignals?: signal.SignalDefinition[]
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
export { DialogProps, DialogDefinition, DialogState }

export default DialogPropertyDefinition
