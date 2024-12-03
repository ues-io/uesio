import { FC, ReactNode } from "react"
import { api, definition, styles, context, wire } from "@uesio/ui"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter"
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import CodeField from "../codefield/codefield"

interface MarkDownFieldProps {
	setValue?: (value: wire.FieldValue) => void
	value: wire.FieldValue
	mode?: context.FieldMode
	readonly?: boolean
}

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

type HeaderProps = {
	level: number
	className: string
	children: ReactNode
}

const generateSlug = (content: ReactNode) => {
	if (!Array.isArray(content)) return
	if (!content.length) return
	const contentString = content[0] as string
	return contentString
		.replace(/^\s+|\s+$/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9 -]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
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
	img: [],
	imgWrapper: [],
	imgTitle: [],
	imgInner: [],
})

const isRelativeUrl = (url?: string) => (url ? url?.startsWith("./") : false)

const MarkDownField: definition.UtilityComponent<MarkDownFieldProps> = (
	props
) => {
	const { context, mode, readonly, setValue } = props

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.markdownfield"
	)
	const value = context.mergeString(props.value as string)
	const record = context.getRecord()
	const recordid = record?.getIdFieldValue()
	const recordmod =
		(record?.getFieldValue<number>("uesio/core.updatedat") || 0) + ""

	if (!readonly && mode === "EDIT") {
		return (
			<CodeField
				language="markdown"
				className={classes.root}
				value={value}
				context={context}
				setValue={(v) => setValue?.(v)}
				mode="EDIT"
			/>
		)
	}

	return (
		<ReactMarkdown
			children={value}
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
				img: (props) => {
					let { src, alt } = props
					const { title } = props

					const metastring = alt
					alt = metastring?.replace(/ *\{[^)]*\} */g, "")
					const metaWidth = metastring?.match(/{([^}]+)x/)
					const metaHeight = metastring?.match(/x([^}]+)}/)
					const width = metaWidth ? metaWidth[1] : undefined
					const height = metaHeight ? metaHeight[1] : undefined

					if (src && isRelativeUrl(src)) {
						if (recordid) {
							src = api.file.getAttachmentURL(
								context,
								recordid,
								src.slice(2),
								recordmod + ""
							)
						} else {
							src = ""
						}
					}

					return (
						<div className={classes.imgWrapper}>
							<div className={classes.imgInner}>
								<img
									className={classes.img}
									alt={alt}
									title={title}
									src={src}
									width={width}
									height={height}
								/>
							</div>
							<div className={classes.imgTitle}>{title}</div>
						</div>
					)
				},
				a: (props) => (
					<a className={classes.a} href={props.href}>
						{props.children}
					</a>
				),
				code: ({ node, inline, className, children, ...props }) => {
					const match = /language-(\w+)/.exec(className || "")
					return !inline && match ? (
						<div className={classes.code}>
							<SyntaxHighlighter
								{...props}
								className={classes.code}
								children={String(children).replace(/\n$/, "")}
								style={materialDark}
								language={match[1]}
								PreTag="div"
							/>
						</div>
					) : (
						<span className={classes.code}>
							<code {...props} className={className}>
								{children}
							</code>
						</span>
					)
				},
			}}
		/>
	)
}

export default MarkDownField
