import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection } from "@uesio/ui"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter"
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism"

import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash"
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml"

SyntaxHighlighter.registerLanguage("bash", bash)
SyntaxHighlighter.registerLanguage("yaml", yaml)

interface MarkDownFieldProps extends definition.UtilityProps {
	setValue: (value: string) => void
	value: string | null
	fieldMetadata: collection.Field
	mode?: context.FieldMode
}

const MarkDownField: FunctionComponent<MarkDownFieldProps> = (props) => {
	const { setValue, value, mode } = props
	const readonly = mode === "READ"
	const classes = styles.useUtilityStyles(
		{
			input: {
				resize: "none",
			},
			readonly: {},
			markdown: {},
		},
		props
	)

	const commonProps = {
		value: value || "",
		className: styles.cx(classes.input, readonly && classes.readonly),
		disabled: readonly,
		onChange: (
			event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
		) => setValue(event.target.value),
	}

	return readonly ? (
		<div>
			<ReactMarkdown
				children={value || ""}
				remarkPlugins={[remarkGfm]}
				className={classes.markdown}
				components={{
					code({ node, inline, className, children, ...props }) {
						const match = /language-(\w+)/.exec(className || "")
						return !inline && match ? (
							<SyntaxHighlighter
								children={String(children).replace(/\n$/, "")}
								style={materialDark}
								language={match[1]}
								PreTag="div"
								{...props}
							/>
						) : (
							<code className={className} {...props}>
								{children}
							</code>
						)
					},
				}}
			/>
		</div>
	) : (
		<textarea {...commonProps} rows={40} cols={40} />
	)
}

export { MarkDownFieldProps }

export default MarkDownField
