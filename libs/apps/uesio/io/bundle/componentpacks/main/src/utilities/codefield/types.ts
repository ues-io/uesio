import { EditorProps, OnChange } from "@monaco-editor/react"
import type monaco from "monaco-editor"
import { context } from "@uesio/ui"

export interface CodeFieldUtilityProps {
	setValue: OnChange
	value: string
	language?: string
	mode?: context.FieldMode
	options?: monaco.editor.IStandaloneEditorConstructionOptions
	onMount?: EditorProps["onMount"]
	// An array of URIs which contain ambient type definitions to load in this code field
	typeDefinitionFileURIs?: string[]
}
