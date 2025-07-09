function run(botapi) {
  const params = botapi.params.getAll()
  const { name, label, description, prompt } = params
  const namespace = botapi.getAppName()

  const basePath = `agents/${name}`

  botapi.generateStringFile(`${basePath}/prompt.txt`, prompt)

  botapi.generateFile(
    `${basePath}/agent.yaml`,
    { name, label, description },
    `templates/agent.yaml`,
  )

  botapi.setRedirect(`/agents/${namespace}/${name}`)
}
