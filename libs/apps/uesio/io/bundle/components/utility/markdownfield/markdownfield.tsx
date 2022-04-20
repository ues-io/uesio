import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection } from "@uesio/ui"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface MarkDownFieldProps extends definition.UtilityProps {
	setValue: (value: string) => void
	value: string | null
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	placeholder?: string
	password?: boolean
}

const MarkDownField: FunctionComponent<MarkDownFieldProps> = (props) => {
	const { setValue, value, mode, placeholder } = props
	const readonly = mode === "READ"
	const classes = styles.useUtilityStyles(
		{
			input: {
				resize: "none",
			},
			readonly: {},
		},
		props
	)

	const commonProps = {
		value: value || "",
		placeholder,
		className: styles.cx(classes.input, readonly && classes.readonly),
		disabled: readonly,
		onChange: (
			event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
		) => setValue(event.target.value),
	}

	return readonly ? (
		<ReactMarkdown
			children={value || ""}
			remarkPlugins={[remarkGfm]}
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
	) : (
		<textarea {...commonProps} rows={40} cols={40} />
	)
}

export default MarkDownField
