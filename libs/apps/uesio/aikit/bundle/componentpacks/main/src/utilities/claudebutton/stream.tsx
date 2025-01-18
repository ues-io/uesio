type ClaudeArrayStreamTextHandlerOptions = {
  onItem?: (item: unknown) => void
}

type ParseResult = {
  remaining?: string
  objects?: object[]
}

const strictParse = (input: string): ParseResult => {
  // First try to find an object delimiter with a comma after it
  const startIndex = input.indexOf("{")
  let endIndex = input.indexOf("},")
  if (endIndex === -1) {
    endIndex = input.indexOf("}")
  }
  // If we have both a start index and an end index, parse that out
  if (startIndex !== -1 && endIndex !== -1) {
    const objectString = input.substring(startIndex, endIndex + 1)
    try {
      const obj = JSON.parse(objectString)
      input = input.substring(endIndex + 1)
      return {
        remaining: input,
        objects: [obj],
      }
    } catch {
      // If we can't parse the data, break out, we can't parse what we've got
      return {
        remaining: input,
      }
    }
  }
  return {
    remaining: input,
  }
}

const getClaudeArrayStreamHandler = (
  options: ClaudeArrayStreamTextHandlerOptions,
) => {
  let buffer = ""
  return (chunk: string) => {
    buffer += chunk
    let remaining = buffer
    while (remaining.includes("}")) {
      const parseResult = strictParse(remaining)
      if (parseResult.objects) {
        parseResult.objects.forEach((obj) => options.onItem?.(obj))
        if (parseResult.remaining || parseResult.remaining === "") {
          remaining = parseResult.remaining
        }
      } else {
        break
      }
    }
    buffer = remaining
  }
}

export { getClaudeArrayStreamHandler }
