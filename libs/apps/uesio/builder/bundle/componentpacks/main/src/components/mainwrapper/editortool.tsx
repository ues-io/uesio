import { signal, context } from "@uesio/ui"
import { getContent, setContent } from "../../api/defapi"
import { getSelectedViewPath } from "../../api/stateapi"

type TextResponse = {
  type: "text"
  text: string
}

type ToolUseResponse = {
  type: "tool_use"
  id: string
  name: string
  input: EditorCommand
}

type ToolResultResponse = {
  type: "tool_result"
  tool_use_id: string
  content: string
}

type ReplaceCommand = {
  command: "str_replace"
  path: string
  old_str: string
  new_str: string
}

type InsertCommand = {
  command: "insert"
  path: string
  insert_line: number
  new_str: string
}

type EditorCommand = ReplaceCommand | InsertCommand

type AnthropicResponse = TextResponse | ToolUseResponse | ToolResultResponse

const handleReplaceCommand = (
  context: context.Context,
  message: ToolUseResponse,
  command: ReplaceCommand,
): ToolResultResponse => {
  const selectedPath = getSelectedViewPath(
    context.removeViewFrame(1).removeViewFrame(1),
  )
  const content = getContent(context, selectedPath)

  if (!content) {
    return {
      type: "tool_result",
      tool_use_id: message.id,
      content: "Failed: Nothing to edit.",
    }
  }

  // Find first occurrence
  const firstIndex = content.indexOf(command.old_str)
  if (firstIndex === -1) {
    return {
      type: "tool_result",
      tool_use_id: message.id,
      content: "Failed: Uh oh. Looks like that string wasn't found.",
    }
  }

  // Find last occurrence
  const lastIndex = content.lastIndexOf(command.old_str)

  // If first and last indices differ, there must be multiple occurrences
  if (firstIndex !== lastIndex) {
    return {
      type: "tool_result",
      tool_use_id: message.id,
      content:
        "Failed: Uh oh. Looks like there are multiple instances of that string.",
    }
  }

  const newContent = content.replace(command.old_str, command.new_str)
  setContent(context, selectedPath, newContent)
  return {
    type: "tool_result",
    tool_use_id: message.id,
    content:
      "Success! The file has been updated. Please ignore any old versions of this file and only use updated versions.",
  }
}

const handleReplaceEditor = (
  context: context.Context,
  message: ToolUseResponse,
): ToolResultResponse => {
  const command = message.input
  if (command.command === "str_replace") {
    return handleReplaceCommand(context, message, command)
  }

  return {
    type: "tool_result",
    tool_use_id: message.id,
    content: "Failed: Command not supported: " + command.command,
  }
}

const handleMessage = (
  context: context.Context,
  message: ToolUseResponse,
): ToolResultResponse => {
  if (message.name === "str_replace_editor") {
    return handleReplaceEditor(context, message)
  }

  return {
    type: "tool_result",
    tool_use_id: message.id,
    content: "Failed: Tool not supported: " + message.name,
  }
}

const getSelectedContentDispatcher: signal.ComponentSignalDispatcher<
  unknown
> = (state, payload, context) => {
  const selectedPath = getSelectedViewPath(context.removeViewFrame(1))
  const content = getContent(context, selectedPath)
  return context.addComponentFrame("uesio/aikit.agent_chat", {
    content,
  })
}

const handleEditsDispatcher: signal.ComponentSignalDispatcher<unknown> = (
  state,
  payload,
  context,
) => {
  const results = context.getComponentData("uesio/aikit.agent_chat")

  const messages = results.data.results as AnthropicResponse[]

  if (!messages) return

  const selectedPath = getSelectedViewPath(
    context.removeViewFrame(1).removeViewFrame(1),
  )
  const content = getContent(context, selectedPath)
  if (!content) return
  const response = messages
    .filter((message) => message.type === "tool_use")
    .map((message) => {
      return handleMessage(context, message)
    })
  return context.addComponentFrame("uesio/aikit.agent_chat", {
    response,
  })
}

export { getSelectedContentDispatcher, handleEditsDispatcher }
