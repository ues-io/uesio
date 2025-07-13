import { nanoid } from "@reduxjs/toolkit"
import { component, styles, definition, signal, api, context } from "@uesio/ui"
import { useState } from "react"

type AgentBotResponse = {
  results: unknown
}

type ToolResultResponse = {
  type: "tool_result"
  tool_use_id: string
  content: string
}

type AgentChatDefinition = {
  buttonLabel?: string
  wire: string
  agent: string
  thread: string
  beforeChatSignals?: signal.SignalDefinition[] | string
  afterChatSignals?: signal.SignalDefinition[] | string
}

const REPLACEMENT_TOOL = "str_replace_based_edit_tool"

const StyleDefaults = Object.freeze({
  root: [],
  actions: [],
  textarea: [],
})

const mergeAndRunSignals = async (
  signals: signal.SignalDefinition[] | string | undefined,
  context: context.Context,
) => {
  const signalsToRun =
    typeof signals === "string"
      ? (context.merge(signals) as signal.SignalDefinition[])
      : signals
  if (signalsToRun) {
    return await api.signal.runMany(signalsToRun, context)
  }
  return context
}

const newToolUseMessage = (
  toolId: string,
  fileName: string,
  thread: string,
) => ({
  "uesio/aikit.author": "ASSISTANT",
  "uesio/aikit.type": "tool_use",
  "uesio/aikit.tool_use_id": toolId,
  "uesio/aikit.tool_name": REPLACEMENT_TOOL,
  "uesio/aikit.tool_input": {
    command: "view",
    path: fileName,
  },
  // TODO: Defaults should be respected here...
  "uesio/aikit.thread": {
    "uesio/core.id": thread,
  },
})

const newToolResultMessage = (
  toolId: string,
  fileContent: string,
  thread: string,
) => ({
  "uesio/aikit.author": "USER",
  "uesio/aikit.type": "tool_result",
  "uesio/aikit.tool_use_id": toolId,
  "uesio/aikit.tool_name": REPLACEMENT_TOOL,
  "uesio/aikit.content": fileContent,
  // TODO: Defaults should be respected here...
  "uesio/aikit.thread": {
    "uesio/core.id": thread,
  },
})

const newUserTextMessage = (text: string, thread: string) => ({
  "uesio/aikit.author": "USER",
  "uesio/aikit.type": "text",
  "uesio/aikit.content": text,
  // TODO: Defaults should be respected here...
  "uesio/aikit.thread": {
    "uesio/core.id": thread,
  },
})

const AgentChat: definition.UC<AgentChatDefinition> = (props) => {
  const { definition, context } = props
  const {
    buttonLabel = "Ask Agent",
    wire,
    beforeChatSignals,
    afterChatSignals,
  } = definition
  const thread = context.mergeString(definition.thread)
  const agent = context.mergeString(definition.agent)
  const Button = component.getUtility("uesio/io.button")
  const Group = component.getUtility("uesio/io.group")
  const TextArea = component.getUtility("uesio/io.textareafield")

  const classes = styles.useStyleTokens(StyleDefaults, props)

  const [value, setValue] = useState("")

  const handleButtonClick = async () => {
    let newContext: context.Context = context.removeViewFrame(1)
    const inputValue = value

    // Run the before chat signals.
    // The expectation here is that the signals run will add
    // component data to the context on the component "uesio/aikit.agent_chat"
    // with the property "content".
    newContext = await mergeAndRunSignals(beforeChatSignals, newContext)

    // Check to see if any file data was returned
    const fileContent = newContext.getComponentDataValue<string>(
      "uesio/aikit.agent_chat",
      "content",
    )

    const toolId = "uesio_tool_" + nanoid()

    // TODO: we could actually get the filename as well here.
    const fileName = `myview_${Date.now()}.yaml`

    const threadWire = context.getWire(wire)
    if (!threadWire) return

    if (fileContent) {
      // If file content was provided in the context, create a fake tool
      // use and tool result message so that the ai model already has this
      // file data in context.
      // TODO: we may want to handle this in a more generic way in the future.
      threadWire.createRecord(newToolUseMessage(toolId, fileName, thread))
      threadWire.createRecord(newToolResultMessage(toolId, fileContent, thread))
      await threadWire.save(context)
    }

    // Add the temporary chat while we go to the server.
    // This improves the ux so that the users sees their chat message
    // immediately while waiting for the ai model to respond.
    threadWire.createRecord(newUserTextMessage(inputValue, thread))

    setValue("")

    const chatResponse = await api.bot.callBot(
      context,
      "uesio/aikit",
      "runagent",
      {
        thread,
        agent,
        input: inputValue,
        // This helps the ai model know which file we're taking about
        // when we ask for edits.
        hiddenInputPrefix: "Editing file: " + fileName + "\n\n",
      },
    )

    if (!chatResponse.success || chatResponse.error) {
      api.notification.addError(
        chatResponse.error || "agent chat failed",
        context.deleteWorkspace(),
      )
      return
    }

    // This removes the temporary chat message before saving the wire
    threadWire.cancel()
    await threadWire.load(context)

    const agentResults = chatResponse.params as AgentBotResponse

    if (!agentResults) return

    // Run the after chat signals.
    // The expectation here is that the signals run will add
    // component data to the context on the component "uesio/aikit.agent_chat"
    // with the property "response".
    newContext = await mergeAndRunSignals(
      afterChatSignals,
      newContext.addComponentFrame("uesio/aikit.agent_chat", agentResults),
    )

    // Read the tool results context and add the response.
    const response = newContext.getComponentDataValue<ToolResultResponse[]>(
      "uesio/aikit.agent_chat",
      "response",
    )

    if (!response || !response.length) return

    response.forEach((message) => {
      threadWire.createRecord(
        newToolResultMessage(message.tool_use_id, message.content, thread),
      )
    })

    await threadWire.save(context)
  }

  return (
    <div className={classes.root}>
      <TextArea
        value={value}
        setValue={setValue}
        context={context}
        classes={{ input: classes.textarea }}
      />
      <Group classes={{ root: classes.actions }} context={context}>
        <Button
          label={buttonLabel}
          variant="uesio/appkit.secondary_small"
          context={context}
          onClick={handleButtonClick}
        />
      </Group>
    </div>
  )
}

export default AgentChat
