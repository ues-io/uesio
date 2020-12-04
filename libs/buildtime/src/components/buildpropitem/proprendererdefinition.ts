import { definition, builder } from "@uesio/ui"

interface PropRendererProps extends definition.BaseProps {
	descriptor: builder.PropDescriptor
	setValue: (value: definition.DefinitionValue) => void
	getValue: () => definition.Definition
}

const inputStyles = {
	marginBottom: "10px",
	background: "white",
}

const inputProps = {
	style: {
		fontSize: "11pt",
	},
}

const inputLabelProps = {
	disableAnimation: true,
	style: {
		fontSize: "12pt",
	},
	shrink: true,
}

export { inputStyles, inputProps, inputLabelProps, PropRendererProps }
