import { component, definition, styles, api, context, util } from "@uesio/ui"
import Editor, { loader, Monaco, type OnChange } from "@monaco-editor/react"
import type monaco from "monaco-editor"
import type { CodeFieldUtilityProps } from "./types"
import { useEffect, useMemo, useRef, useState } from "react"
import { useDeepCompareEffect } from "react-use"
import debounce from "lodash/debounce"
import { shikiToMonaco } from "@shikijs/monaco"
import { highlighter, highlightThemeDefault } from "../syntax-highlight"
const { ErrorMessage } = component

const staticAssetsHost = api.platform.getStaticAssetsHost()
const staticAssetsPath = api.platform.getStaticAssetsPath()
const { getFileText } = api.platform

loader.config({
  paths: {
    vs: `${staticAssetsHost}/static${staticAssetsPath}/vendor/monaco-editor/src/vs`,
  },
})

const preprocessTypeFileURIs = (
  uris: string[] | undefined,
  context: context.Context,
) => {
  if (uris === undefined) return []
  return uris.map((uri) => context.mergeString(uri))
}

const StyleDefaults = Object.freeze({
  input: [],
  readonly: [],
  loading: [],
})

const DEFAULT_DEBOUNCE_INTERVAL = 100

const CodeField: definition.UtilityComponent<CodeFieldUtilityProps> = (
  props,
) => {
  const {
    setValue,
    value,
    language = "typescript",
    options,
    onMount,
    beforeMount,
    context,
    theme = highlightThemeDefault,
    mode,
  } = props
  const debounceInterval = props.debounce || DEFAULT_DEBOUNCE_INTERVAL
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")
  const typeDefinitionFileURIs = preprocessTypeFileURIs(
    props.typeDefinitionFileURIs,
    context,
  )
  const classes = styles.useUtilityStyleTokens(
    StyleDefaults,
    props,
    "uesio/io.codefield",
  )
  const mergedLanguage = context.mergeString(language).toLowerCase()

  const [loadedModels, setLoadedModels] = useState({} as Record<string, string>)

  const isReadOnly = mode === "READ"
  const currentValuesRef = useRef({ isReadOnly, value })
  useEffect(() => {
    currentValuesRef.current = { isReadOnly, value }
  }, [isReadOnly, value])
  const debouncedSetValue = useMemo(
    () =>
      setValue &&
      debounce(
        ((newValue, ev) => {
          // Do not call setValue when we are currently read-only or the value from monaco is the same as the current value.
          // This is necessary because we using value as a controlled input for Monaco since we can modify the wire outside
          // of Monaco itself (e.g., user hits cancel button). Monaco behaves different in this way than a standard html input 
          // which does not fire onChange when the value prop changes programmatically. Monaco is smart enough to not fire the 
          // change event when the value prop (via code) changes (see https://github.com/suren-atoyan/monaco-react/blob/1e3c3efc29ae3b6d07af7545a9a3da6fa9142ba4/src/Editor/Editor.tsx#L213), 
          // however it only applies this detection logic when the editor is in EDIT mode. After cancel, we've switched to READ 
          // mode and so monaco always fires onChange (see https://github.com/suren-atoyan/monaco-react/blob/1e3c3efc29ae3b6d07af7545a9a3da6fa9142ba4/src/Editor/Editor.tsx#L99).
          // We really do not need both of these checks, we could just detect specifically for the EDIT->READ switch condition
          // but we are being defensive here and checking the mode and the value delta and only calling setValue when EDIT
          // and the value is different than what we have in state.
          // TODO: Our wire APIs should be updated to compare the value being set to the original values and not mark as a change
          // however any call to wire update, regardless of its value, will be treated as a change. Note that while an improvement
          // overall, it would only mask the issue here with Monaco so the below could should still be in-place. Need to file a bug
          // with Monaco on this as onChange should not fire when the value prop changes regardless of editor mode.
          const { isReadOnly: currentIsReadOnly, value: currentValue } =
            currentValuesRef.current
          if (currentIsReadOnly || newValue === currentValue) return
          setValue(newValue, ev)
        }) as OnChange,
        debounceInterval,
      ),
    [debounceInterval, setValue],
  )

  useEffect(
    () => () => {
      debouncedSetValue?.cancel()
    },
    [debouncedSetValue],
  )

  useDeepCompareEffect(() => {
    ;(async () => {
      try {
        const newModels = {} as Record<string, string>
        await Promise.all(
          typeDefinitionFileURIs
            .filter((uri) => !!uri)
            .map((uri) =>
              getFileText(uri).then((data) => {
                newModels[uri] = data
                return data
              }),
            ),
        )
        setLoadedModels(newModels)
      } catch (error) {
        setLoadingError(util.getErrorString(error))
      } finally {
        setLoading(false)
      }
    })()
    return
  }, [typeDefinitionFileURIs])

  function handleEditorWillMount(monaco: Monaco) {
    const loadedTypeModelUris = Object.keys(loadedModels)
    if (loadedTypeModelUris.length > 0) {
      // Synchronize our current models with the new models.
      const existingModels = monaco.editor.getModels()
      const existingModelsById = {} as Record<string, monaco.editor.ITextModel>
      existingModels.forEach((model) => {
        existingModelsById[model.uri.toString()] = model
      })
      loadedTypeModelUris.forEach((uri) => {
        const monacoUri = monaco.Uri.parse(uri)
        const id = monacoUri.toString()
        const model = existingModelsById[id]
        const modelContents = loadedModels[uri]
        // If we don't have this Model yet, create it
        if (!model) {
          monaco.editor.createModel(modelContents, mergedLanguage, monacoUri)
        } else {
          // If we DO have this model already, replace its contents, if changed
          const currentValue = model.getValue()
          if (currentValue !== modelContents) {
            model.setValue(modelContents)
          }
          delete existingModelsById[id]
        }
      })
      // Remove any other models
      Object.values(existingModelsById).forEach((model) => {
        model.dispose()
      })
    }
    shikiToMonaco(highlighter, monaco)
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true)

    beforeMount?.(monaco)
  }

  function handleEditorDidMount(
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) {
    onMount?.(editor, monaco)
  }

  const loadingNode = (
    <div className={classes.loading}>
      Loading language models for {mergedLanguage}...
    </div>
  )

  if (loading) {
    return loadingNode
  }

  if (!loading && loadingError) {
    return (
      <ErrorMessage
        title="Code editor"
        error={
          new Error(
            `Failed to load language models for code editor, error is: ${loadingError}`,
          )
        }
      />
    )
  }

  return (
    <div className={classes.input}>
      <Editor
        value={value}
        loading={loadingNode}
        options={{
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly: isReadOnly,
          minimap: {
            enabled: false,
          },
          ...options,
        }}
        theme={theme}
        language={mergedLanguage}
        onChange={debouncedSetValue}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
      />
    </div>
  )
}

export default CodeField
