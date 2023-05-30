import { FC, ReactNode } from "react"
import { definition, styles, context, wire } from "@uesio/ui"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter"
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface MarkDownFieldProps extends definition.UtilityProps {
	setValue?: (value: wire.FieldValue) => void
	value: wire.FieldValue
	mode?: context.FieldMode
}

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

type HeaderProps = {
	level: number
	className: string
}

const generateSlug = (content: ReactNode) => {
	if (typeof content !== "string") {
		return ""
	}
	const str = content
		.replace(/^\s+|\s+$/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9 -]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
	return str
}

const Heading: FC<HeaderProps> = ({ level, className, children }) => {
	const Element = ("h" + level) as HeadingElement
	return (
		<Element id={generateSlug(children)} className={className}>
			{children}
		</Element>
	)
}

const StyleDefaults = Object.freeze({
	root: [],
	h1: [],
	h2: [],
	h3: [],
	h4: [],
	h5: [],
	h6: [],
	p: [],
	ol: [],
	ul: [],
	li: [],
	code: [],
	a: [],
})

const MarkDownField: definition.UtilityComponent<MarkDownFieldProps> = (
	props
) => {
	const { value } = props

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.markdownfield"
	)

	return (
		<ReactMarkdown
			children={(value as string) || ""}
			remarkPlugins={[remarkGfm]}
			className={classes.root}
			components={{
				p: (props) => <p className={classes.p}>{props.children}</p>,
				h1: (props) => <Heading {...props} className={classes.h1} />,
				h2: (props) => <Heading {...props} className={classes.h2} />,
				h3: (props) => <Heading {...props} className={classes.h3} />,
				h4: (props) => <Heading {...props} className={classes.h4} />,
				h5: (props) => <Heading {...props} className={classes.h5} />,
				h6: (props) => <Heading {...props} className={classes.h6} />,
				ol: (props) => <ol className={classes.ol}>{props.children}</ol>,
				ul: (props) => <ul className={classes.ul}>{props.children}</ul>,
				li: (props) => <li className={classes.li}>{props.children}</li>,
				a: (props) => (
					<a className={classes.a} href={props.href}>
						{props.children}
					</a>
				),
				code: ({ node, inline, className, children, ...props }) => {
					const match = /language-(\w+)/.exec(className || "")
					return (
						<div className={classes.code}>
							{!inline && match ? (
								<SyntaxHighlighter
									{...props}
									className={classes.code}
									children={String(children).replace(
										/\n$/,
										""
									)}
									style={materialDark}
									language={match[1]}
									PreTag="div"
								/>
							) : (
								<code {...props} className={className}>
									{children}
								</code>
							)}
						</div>
					)
				},
			}}
		/>
	)
}

export default MarkDownField
