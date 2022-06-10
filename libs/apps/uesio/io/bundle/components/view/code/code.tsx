import { FunctionComponent } from "react"
import { component, styles, hooks } from "@uesio/ui"
import { CodeProps } from "./codedefinition"
import { CodeFieldUtilityProps } from "../../utility/codefield/codefield"

const IOCodeField =
	component.getUtility<CodeFieldUtilityProps>("uesio/io.codefield")

const CodeField: FunctionComponent<CodeProps> = (props) => {
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
			value={fileContent || ""}
			setValue={(value: string) => {
				console.log(value)
			}}
			language={language}
			context={context}
			options={{
				lineNumbersMinChars: 0,
			}}
		/>
	)
}

export default CodeField
