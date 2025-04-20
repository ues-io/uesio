import { EditorProps, OnChange } from "@monaco-editor/react"
import type monaco from "monaco-editor"
import { context } from "@uesio/ui"
import type { HighlightTheme } from "../syntax-highlight"

export interface CodeFieldUtilityProps {
  /** time to delay, in ms, before invoking setValue. defaults to 100 ms */
  debounce?: number
  /** function to invoke whenever the code field is changed */
  setValue?: OnChange
  /** initial value for the code field */
  value: string
  /** the code language, e.g. js, yaml, json */
  language?: string
  theme?: HighlightTheme
  /** "READ" | "EDIT" */
  mode?: context.FieldMode
  /** monaco code editor options */
  options?: monaco.editor.IStandaloneEditorConstructionOptions
  onMount?: EditorProps["onMount"]
  beforeMount?: EditorProps["beforeMount"]
  // An array of URIs which contain ambient type definitions to load in this code field
  typeDefinitionFileURIs?: string[]
}
