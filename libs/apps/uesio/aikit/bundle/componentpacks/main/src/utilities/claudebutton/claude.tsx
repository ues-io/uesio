type Tool = {
  name: string
  description: string
  input_schema: InputSchema
}

type AnyTool = {
  type: "any"
}

type AutoTool = {
  type: "auto"
}

type SpecificTool = {
  type: "tool"
  name: string
}

type ToolChoice = AnyTool | AutoTool | SpecificTool

type InputSchema = {
  type: "object" | "array" | "string" | "number" | "boolean"
  properties?: Record<string, InputSchema>
  required?: string[]
  items?: InputSchema
  description?: string
}

type ClaudeHandlerOptions = {
  onTextComplete?: (result: string) => void
  onTextDelta?: (delta: string) => void
  onToolUse?: (tool: string, inputs: unknown) => void
  onToolUseDelta?: (tool: string, delta: string) => void
}

type ClaudeTextDelta = {
  type: "text_delta"
  text: string
}

type ClaudeInputJSONDelta = {
  type: "input_json_delta"
  partial_json: string
}

type ClaudeContentDelta = ClaudeTextDelta | ClaudeInputJSONDelta

type ClaudeToolUseBlock = {
  type: "tool_use"
  id: string
  name: string
}

type ClaudeTextBlock = {
  type: "text"
  text: string
}

type ClaudeContentBlock = ClaudeTextBlock | ClaudeToolUseBlock

type ClaudeMessageStart = {
  type: "message_start"
}

type ClaudeMessageDelta = {
  type: "message_delta"
}

type ClaudeMessageStop = {
  type: "message_stop"
}

type ClaudeContentBlockStart = {
  type: "content_block_start"
  index: number
  content_block: ClaudeContentBlock
}

type ClaudeContentBlockDelta = {
  type: "content_block_delta"
  index: number
  delta: ClaudeContentDelta
}

type ClaudeContentBlockStop = {
  type: "content_block_stop"
  index: number
}

type ClaudeStreamMessage =
  | ClaudeMessageStart
  | ClaudeContentBlockStart
  | ClaudeContentBlockDelta
  | ClaudeContentBlockStop
  | ClaudeMessageDelta
  | ClaudeMessageStop

const getBlockId = (block: ClaudeContentBlock, index: number) =>
  block.type + "_" + index

const getClaudeResponseHandler = (options: ClaudeHandlerOptions) => {
  const resultData: Record<string, string> = {}
  let currentBlock: ClaudeContentBlock
  return (chunk: string) => {
    const resultItems = chunk.split("\n")

    resultItems.forEach((item) => {
      if (!item) return

      const resultJSON = JSON.parse(item) as ClaudeStreamMessage

      if (resultJSON.type === "message_start") {
        // Don't do anything
      }

      if (resultJSON.type === "content_block_start") {
        currentBlock = resultJSON.content_block
        const blockId = getBlockId(currentBlock, resultJSON.index)
        resultData[blockId] = ""
      }

      if (resultJSON.type === "content_block_delta") {
        const blockId = getBlockId(currentBlock, resultJSON.index)
        if (
          currentBlock.type === "text" &&
          resultJSON.delta.type === "text_delta"
        ) {
          const partial = resultJSON.delta.text
          resultData[blockId] += partial
          options.onTextDelta?.(partial)
        }
        if (
          currentBlock.type === "tool_use" &&
          resultJSON.delta.type === "input_json_delta"
        ) {
          const partial = resultJSON.delta.partial_json
          resultData[blockId] += partial
          options.onToolUseDelta?.(currentBlock.name, partial)
        }
      }

      if (resultJSON.type === "content_block_stop") {
        // Don't do anything
        const blockId = getBlockId(currentBlock, resultJSON.index)
        if (currentBlock.type === "text") {
          options.onTextComplete?.(resultData[blockId])
        }
        if (currentBlock.type === "tool_use") {
          options.onToolUse?.(
            currentBlock.name,
            JSON.parse(resultData[blockId]),
          )
        }
      }

      if (resultJSON.type === "message_delta") {
        // Don't do anything
      }

      if (resultJSON.type === "message_stop") {
        // Don't do anything
      }
    })
  }
}

export type { Tool, ToolChoice }

export { getClaudeResponseHandler }
