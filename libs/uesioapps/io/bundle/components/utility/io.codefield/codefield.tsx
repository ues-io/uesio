import { FunctionComponent } from "react"
import { definition, styles, context, component } from "@uesio/ui"
import LazyMonaco from "@uesio/lazymonaco"

interface CodeFieldProps extends definition.UtilityProps {
	setValue: (value: string) => void
	value: string
	language?: string
	mode?: context.FieldMode
	lineNumbers?: "on" | "off"
	lineNumbersMinChars?: number
}

const CodeField: FunctionComponent<CodeFieldProps> = (props) => {
	const { setValue, value, language, lineNumbers, lineNumbersMinChars } =
		props
	const classes = styles.useUtilityStyles(
		{
			input: {
				height: "320px",
			},
			readonly: {},
		},
		props
	)

	return (
		<div className={classes.input}>
			<LazyMonaco
				value={value}
				options={{
					scrollBeyondLastLine: false,
					automaticLayout: true,
					minimap: {
						enabled: false,
					},
					lineNumbers,
					lineNumbersMinChars,
				}}
				language={language || "javascript"}
				onChange={setValue}
			/>
		</div>
	)
}

export default CodeField
