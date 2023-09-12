# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}

# Try to navigate to the workspace home route and make sure that the labels from core and io are there
GET https://{{host}}:{{port}}/site/routes/path/uesio/studio/app/uesio/tests/workspace/dev
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.dependencies.label.entities['uesio/io.save'].value" == "Save"
jsonpath "$.dependencies.label.entities['uesio/io.save'].namespace" == "uesio/io"
jsonpath "$.dependencies.label.entities['uesio/core.session_expiration_msg'].value" == "Your session has expired. Please login again."
jsonpath "$.dependencies.label.entities['uesio/core.session_expiration_msg'].namespace" == "uesio/core"

# Login as Wessel, he is part of the admin team and he speaks Spanish BTW.
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"wessel\"}"
}
HTTP 200
[Asserts]
jsonpath "$.user.username" == "wessel"
jsonpath "$.user.language" == "es"

# Try to navigate to the workspace home route and make sure that the labels are translated
GET https://{{host}}:{{port}}/site/routes/path/uesio/studio/app/uesio/tests/workspace/dev
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.dependencies.label.entities['uesio/io.save'].value" == "Guardar"
jsonpath "$.dependencies.label.entities['uesio/io.save'].namespace" == "uesio/io"
jsonpath "$.dependencies.label.entities['uesio/io.add'].value" == "Añadir"
jsonpath "$.dependencies.label.entities['uesio/io.add'].namespace" == "uesio/io"


#Make sure labels work in a workspace and they are translated
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/publicanimalslist
HTTP 200
[Asserts]
jsonpath "$.dependencies.label.entities['uesio/tests.helloworld'].value" == "hola mundo"
