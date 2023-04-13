import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, wire } from "@uesio/ui"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { code, h } from "./mdcomponents"
import { MDOptions } from "./types"

const defaultMDOptions: MDOptions = {
	hashheadings: true,
}

interface MarkDownFieldProps extends definition.UtilityProps {
	setValue?: (value: wire.FieldValue) => void
	value: wire.FieldValue
	mode?: context.FieldMode
	options?: MDOptions
}

const MarkDownField: FunctionComponent<MarkDownFieldProps> = (props) => {
	const { setValue, value, mode, context, options: userOptions } = props
	const options = { ...defaultMDOptions, ...userOptions }
	const readonly = mode === "READ"
	const classes = styles.useUtilityStyles(
		{
			root: {
				".actions": {
					opacity: 0,
					color: "rgb(251,96,78)",
					"&:hover": {
						opacity: 1,
					},
				},
			},
			input: {
				resize: "none",
			},
			readonly: {},
			markdown: {},

			codeToolbar: {
				position: "absolute",
				top: "0px",
				right: " 0",
				zIndex: 1,
				padding: "5px",
				opacity: 0,
			},
			"h1,h2,h3,h4,h5,h6": {
				"&:hover .actions": {
					opacity: 0.8,
				},
			},

			codeblock: {
				position: "relative",

				"&:hover .codeToolbar": {
					opacity: 1,
				},
			},
		},
		props
	)

	const commonProps = {
		value: (value as string) || "",
		className: styles.cx(classes.input, readonly && classes.readonly),
		disabled: readonly,
		onChange: (
			event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
		) => setValue && setValue(event.target.value),
	}

	const hashheadings = options.hashheadings

	return readonly ? (
		<div className={classes.root}>
			<ReactMarkdown
				children={(value as string) || ""}
				remarkPlugins={[remarkGfm]}
				className={classes.markdown}
				components={{
					h1: (props) => h(props, context, classes, hashheadings),
					h2: (props) => h(props, context, classes, hashheadings),
					h3: (props) => h(props, context, classes, hashheadings),
					h4: (props) => h(props, context, classes, hashheadings),
					h5: (props) => h(props, context, classes, hashheadings),
					h6: (props) => h(props, context, classes, hashheadings),
					code: (props) => code(props, context, classes),
				}}
			/>
		</div>
	) : (
		<textarea {...commonProps} rows={40} cols={40} />
	)
}

export default MarkDownField
