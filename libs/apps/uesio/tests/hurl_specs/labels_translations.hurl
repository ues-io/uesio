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
jsonpath "$.dependencies.label[?(@.name=='save')].value" nth 0 == "Save"
jsonpath "$.dependencies.label[?(@.name=='save')].namespace" nth 0 == "uesio/io"
jsonpath "$.dependencies.label[?(@.name=='session_expiration_msg')].value" nth 0 == "Your session has expired. Please login again."
jsonpath "$.dependencies.label[?(@.name=='session_expiration_msg')].namespace" nth 0 == "uesio/core"

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
jsonpath "$.dependencies.label[?(@.name=='save')].value" nth 0 == "Guardar"
jsonpath "$.dependencies.label[?(@.name=='save')].namespace" nth 0 == "uesio/io"
jsonpath "$.dependencies.label[?(@.name=='add')].value" nth 0 == "Añadir"
jsonpath "$.dependencies.label[?(@.name=='add')].namespace" nth 0 == "uesio/io"


#Make sure labels work in a workspace and they are translated
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/publicanimalslist
HTTP 200
[Asserts]
jsonpath "$.dependencies.label[0].value" == "hola mundo"
