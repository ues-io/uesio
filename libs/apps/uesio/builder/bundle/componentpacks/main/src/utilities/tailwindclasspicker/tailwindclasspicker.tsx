import { component, definition, wire } from "@uesio/ui"
import { useMemo, useState } from "react"
import fuzzysort from "fuzzysort"
import SearchArea from "../../helpers/searcharea"

type Props = {
  setValue?: (value: wire.PlainFieldValue) => void
  value?: wire.FieldValue
  parsedTokens: string[][]
}

type SortResult = {
  className: string
  css: string
}

const maxDisplayResults = 25

const TailwindClassPicker: definition.UtilityComponent<Props> = (props) => {
  const { context, setValue, parsedTokens } = props
  const Button = component.getUtility("uesio/io.button")

  const tailwindClasses = useMemo(
    () =>
      parsedTokens.map(([className, cssClasses]) => ({
        className,
        classNamePrepared: fuzzysort.prepare(className),
        css: cssClasses,
        cssPrepared: fuzzysort.prepare(cssClasses),
      })),
    [parsedTokens],
  )

  const [searchTerm, setSearchTerm] = useState("")

  const results = fuzzysort
    .go<SortResult>(searchTerm, tailwindClasses, {
      keys: ["classNamePrepared", "cssPrepared"],
      // allowTypo: false,
      // threshold: -10000,
    })
    .slice(0, maxDisplayResults)

  return (
    <>
      <SearchArea
        placeholder="Enter a Tailwind class or CSS property..."
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        context={context}
        onSelect={() => {
          setValue?.(searchTerm)
        }}
      />
      {results.map(({ obj: { className, css } }) => (
        <Button
          variant="uesio/builder.tailwindtoken"
          key={className}
          label={`${className} (${css})}`}
          context={context}
          onClick={() => setValue?.(className)}
        />
      ))}
      {searchTerm && results.length === 0 && (
        <Button
          variant="uesio/builder.tailwindtoken"
          key={searchTerm}
          label={searchTerm + " (custom)"}
          context={context}
          onClick={() => setValue?.(searchTerm)}
        />
      )}
    </>
  )
}

export default TailwindClassPicker
