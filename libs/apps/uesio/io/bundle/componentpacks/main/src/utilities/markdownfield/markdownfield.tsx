import { ClassAttributes, FC, HTMLAttributes, ReactNode } from "react"
import { api, definition, styles, context, wire } from "@uesio/ui"
import ReactMarkdown, { ExtraProps } from "react-markdown"
import remarkGfm from "remark-gfm"
import CodeField from "../codefield/codefield"
import rehypeShikiFromHighlighter from "@shikijs/rehype/core"
import {
  highlighter,
  type HighlightTheme,
  highlightThemeDefault,
} from "../syntax-highlight"
import { visit } from "unist-util-visit"
import type { Element as HastElement, Root } from "hast"

interface MarkDownFieldProps {
  setValue?: (value: wire.FieldValue) => void
  value: wire.FieldValue
  mode?: context.FieldMode
  readonly?: boolean
  theme?: HighlightTheme
}

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

const generateSlug = (content: ReactNode) => {
  if (!(typeof content === "string")) return
  return content
    .replace(/^\s+|\s+$/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

const Heading: FC<
  ClassAttributes<HTMLHeadingElement> &
    HTMLAttributes<HTMLHeadingElement> &
    ExtraProps
> = ({ node, className, children }) => {
  const Element = (node?.tagName || "h1") as HeadingElement
  return (
    <Element id={generateSlug(children)} className={className}>
      {children}
    </Element>
  )
}

/**
 * Rehype plugin to add an 'inline' property to <code> elements
 * Sets 'inline' property to true if the <code> is not within a <pre> tag
 */
const rehypeInlineCodeProperty = () => {
  return (tree: Root): undefined => {
    visit(tree, "element", (node: HastElement, _index, parent: HastElement) => {
      if (node.tagName === "code" && parent.tagName !== "pre") {
        node.properties.inline = true
      }
    })
  }
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
  codeInline: [],
  a: [],
  img: [],
  imgWrapper: [],
  imgTitle: [],
  imgInner: [],
})

const isRelativeUrl = (url?: string) => (url ? url?.startsWith("./") : false)

const MarkDownField: definition.UtilityComponent<MarkDownFieldProps> = (
  props,
) => {
  const {
    context,
    mode,
    readonly,
    setValue,
    theme = highlightThemeDefault,
  } = props

  const classes = styles.useUtilityStyleTokens(
    StyleDefaults,
    props,
    "uesio/io.markdownfield",
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
        theme={theme}
      />
    )
  }

  return (
    <div className={classes.root}>
      <ReactMarkdown
        children={value}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [
            rehypeShikiFromHighlighter,
            highlighter,
            { theme: theme, inline: "tailing-curly-colon" },
          ],
          rehypeInlineCodeProperty,
        ]}
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
                  recordmod + "",
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
          code: ({ node, className, children, ...props }) => {
            const cn = node?.properties.inline
              ? classes.codeInline
              : classes.code
            return (
              <code className={cn} {...props}>
                {children}
              </code>
            )
          },
        }}
      />
    </div>
  )
}

export default MarkDownField
