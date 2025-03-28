# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Try to navigate to the workspace home route and make sure that the labels from core and io are there
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/routes/path/uesio/studio/app/uesio/tests/workspace/dev
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.dependencies.label[?(@.name=='save')].value" nth 0 == "Save"
jsonpath "$.dependencies.label[?(@.name=='save')].namespace" nth 0 == "uesio/io"
jsonpath "$.dependencies.label[?(@.name=='session_expiration_msg')].value" nth 0 == "Your session has expired. Please login again."
jsonpath "$.dependencies.label[?(@.name=='session_expiration_msg')].namespace" nth 0 == "uesio/core"

# Login as Wessel, he is part of the admin team and he speaks Spanish BTW.
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "wessel"
}
HTTP 200
[Asserts]
jsonpath "$.user.username" == "wessel"
jsonpath "$.user.language" == "es"

# Try to navigate to the workspace home route and make sure that the labels are translated
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/routes/path/uesio/studio/app/uesio/tests/workspace/dev
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.dependencies.label[?(@.name=='save')].value" nth 0 == "Guardar"
jsonpath "$.dependencies.label[?(@.name=='save')].namespace" nth 0 == "uesio/io"
jsonpath "$.dependencies.label[?(@.name=='add')].value" nth 0 == "Añadir"
jsonpath "$.dependencies.label[?(@.name=='add')].namespace" nth 0 == "uesio/io"


#Make sure labels work in a workspace and they are translated
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/routes/path/uesio/tests/publicanimalslist
HTTP 200
[Asserts]
jsonpath "$.dependencies.label[?(@.name=='helloworld')].value" nth 0 == "hola mundo"
