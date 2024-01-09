import { FC, ReactNode } from "react"
import { api, collection, definition, styles, context, wire } from "@uesio/ui"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter"
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import CodeField from "../codefield/codefield"

export interface MarkdownComponentOptions {
	attachmentsWire?: string
}

export interface MarkdownFieldOptions {
	attachments?: wire.WireRecord[]
}

interface MarkDownFieldProps {
	setValue?: (value: wire.FieldValue) => void
	value: wire.FieldValue
	mode?: context.FieldMode
	readonly?: boolean
	options?: MarkdownFieldOptions
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
	img: [],
})

const isRelativeUrl = (url?: string) => (url ? url?.startsWith("./") : false)
const findAttachmentMatch = (
	attachments: wire.WireRecord[],
	searchPath: string,
	comparator: (attachmentPath: string, searchPath: string) => boolean
): wire.WireRecord | undefined =>
	attachments.find((a) =>
		comparator(a.getFieldValue<string>("uesio/core.path") || "", searchPath)
	)

const MarkDownField: definition.UtilityComponent<MarkDownFieldProps> = (
	props
) => {
	const { options = {}, context, mode, readonly, setValue } = props
	const { attachments } = options

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.markdownfield"
	)
	const value = context.merge((props.value || "") as string) as string

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
					let { src } = props
					// If we encounter a relative image URL in Markdown,
					// we assume that the image is an attachment to the context record.
					// Attachment records must be passed in via a higher-order component,
					// so if we don't have any, we just can't serve this record, we will
					if (isRelativeUrl(src)) {
						if (attachments?.length) {
							src = src?.substring(2) || ""
							// First check for a direct match
							let match = findAttachmentMatch(
								attachments,
								src,
								(a, b) => a === b
							)
							// If we did NOT find a direct match, check for a contains match,
							// as we could be dealing with a file nested in a subfolder,
							// e.g. src might be "./createnewapp.png" but attachment might have path "first-app/createnewapp.png"
							if (!match) {
								match = findAttachmentMatch(
									attachments,
									src,
									(a, b) => a.includes(b)
								)
							}
							if (match) {
								src = api.file.getUserFileURL(
									context,
									match.getIdFieldValue(),
									match.getFieldValue<string>(
										collection.UPDATED_AT_FIELD
									)
								)
							}
						} else {
							console.error(
								"Markdown included a relative image path, but no attachments were provided to this component. Please check that you are specifying an attachmentsWire property on the Markdown field/component."
							)
						}
					}
					return <img className={classes.img} {...props} src={src} />
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
