###############################################################
# Tests invoking bedrock integration actions
###############################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

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
  "input": "",
  "messages": [],
  "system": "",
  "model": "uesio.test-simple-responder",
  "max_tokens_to_sample": 4096
}
```
