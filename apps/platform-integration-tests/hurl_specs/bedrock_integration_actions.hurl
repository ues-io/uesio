###############################################################
# Tests invoking bedrock integration actions
###############################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Invoke the test model -- sanity test
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/integrationactions/run/uesio/aikit/bedrock?action=invokemodel
{
    "model": "uesio.test-simple-responder",
    "messages": [],
		"system": "",
		"tools": []
}
HTTP 200
[Asserts]
```
Uesio Test Model was invoked with the following options:

{
  "messages": [],
  "model": "uesio.test-simple-responder",
  "system": "",
  "tools": []
}
```

# Invoke the deprecated test model with a compatibility mapping
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/integrationactions/run/uesio/aikit/bedrock?action=invokemodel
{
    "model": "uesio.test-simple-responder-deprecated",
    "messages": [],
		"system": "test",
		"tools": []
}
HTTP 200
[Asserts]
```
Uesio Test Model was invoked with the following options:

{
  "messages": [],
  "model": "uesio.test-simple-responder",
  "system": "test",
  "tools": []
}
```

# Invoke the anthropic test model -- and verify that input and system parameters are expanded
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/integrationactions/run/uesio/aikit/bedrock?action=invokemodel
{
    "model": "uesio.test-anthropic-format",
    "input": "hello!",
    "system": "you are a good bot"
}
HTTP 200
[Asserts]
jsonpath "$[0].text" == ```
Uesio Test Model was invoked with the following options:

{
  "max_tokens": 4096,
  "messages": [
    {
      "content": [
        {
          "text": "hello!",
          "type": "text"
        }
      ],
      "role": "user"
    }
  ],
  "model": "uesio.test-anthropic-format",
  "system": [
    {
      "text": "you are a good bot",
      "type": "text"
    }
  ]
}
```

