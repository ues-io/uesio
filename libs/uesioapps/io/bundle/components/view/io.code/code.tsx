import { FunctionComponent } from "react"
import { definition, component, styles, hooks } from "@uesio/ui"

type CodeFieldDefinition = {
	language?: CodeFieldLanguage
	label?: string
	file: string
}

type CodeFieldLanguage = "yaml" | "json" | "javascript" | "html" | "css"

interface Props extends definition.BaseProps {
	definition: CodeFieldDefinition
}

const IOCodeField = component.registry.getUtility("io.codefield")

const CodeField: FunctionComponent<Props> = (props) => {
	const { definition, context } = props
	const uesio = hooks.useUesio(props)
	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
	const language = definition?.language || "yaml"
	const fileContent = uesio.file.useFile(context, definition.file)

	return (
		<IOCodeField
			classes={classes}
			label={definition?.label || ""}
			value={fileContent || ""}
			setValue={(value: string) => {
				console.log(value)
			}}
			language={language}
			context={context}
			lineNumbersMinChars={0}
		/>
	)
}

export default CodeField
