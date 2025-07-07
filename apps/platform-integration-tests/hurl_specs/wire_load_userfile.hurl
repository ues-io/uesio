######################################################
# Tests loading a wire
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Get the id of an animal record
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "fields": [
                {
                    "id": "uesio/tests.genus"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "MacAughtrie:Jerrine"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.collections" not exists
jsonpath "$.wires[0].errors" not exists
[Captures]
idvalue: jsonpath "$.wires[0].data[0]['uesio/core.id']"

# Now upload an attachment to this animal
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/upload
Accept: application/json
[MultipartFormData]
details: {"name":"description.txt","collectionID":"uesio/tests.animal","recordID":"{{idvalue}}"}
file: this animal is cool.
HTTP 200
[Asserts]
jsonpath "$.['uesio/core.uniquekey']" == "uesio/tests.animal:{{idvalue}}:attachment:description.txt"
jsonpath "$.['uesio/core.collectionid']" == "uesio/tests.animal"
jsonpath "$.['uesio/core.mimetype']" == "text/plain; charset=utf-8"
jsonpath "$.['uesio/core.recordid']" == "{{idvalue}}"
jsonpath "$.['uesio/core.fieldid']" == ""
jsonpath "$.['uesio/core.filesourceid']" == "uesio/core.platform"
jsonpath "$.['uesio/core.path']" == "description.txt"
jsonpath "$.['uesio/core.type']" == "attachment"
jsonpath "$.['uesio/core.contentlength']" == 20

[Captures]
attachmentid: jsonpath "$.['uesio/core.id']"

# Verify that the download works
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid}}
HTTP 200
[Asserts]
body == "this animal is cool."

# Load the attachment record without the data field
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.userfile",
            "query":true,
            "conditions": [
                {
                    "field": "uesio/core.id",
                    "value": "{{attachmentid}}"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
jsonb_build_object(
'uesio/core.id',main.id,
'uesio/core.uniquekey',main.uniquekey
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.id = $3
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data" count == 1
jsonpath "$.collections" not exists
jsonpath "$.wires[0].errors" not exists
jsonpath "$.wires[0].data[0]['uesio/core.id']" == "{{attachmentid}}"
jsonpath "$.wires[0].data[0]['uesio/core.data']" not exists

# Load the attachment record with the data field
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.userfile",
            "query":true,
            "fields": [
                {
                    "id": "uesio/core.data"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/core.id",
                    "value": "{{attachmentid}}"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].debugQueryString" == ```
SELECT
jsonb_build_object(
'uesio/core.id',main.id,
'uesio/core.uniquekey',main.uniquekey
)
FROM data as "main"
WHERE
main.collection = $1 AND
main.tenant = $2 AND
main.id = $3
ORDER BY main.id asc
LIMIT 501```
jsonpath "$.wires[0].data" count == 1
jsonpath "$.collections" not exists
jsonpath "$.wires[0].errors" not exists
jsonpath "$.wires[0].data[0]['uesio/core.id']" == "{{attachmentid}}"
jsonpath "$.wires[0].data[0]['uesio/core.data']" == "this animal is cool."

# Now delete the file
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/delete/{{attachmentid}}
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.success" == true

# Verify that the file is gone
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid}}
HTTP 404
[Asserts]
body startsWith "couldn't find item from platform load: Collection=uesio/core.userfile, Conditions=uesio/core.id :: {{attachmentid}}"

# Verify 400 when invalid userfileid format
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/download?userfileid=my-bad-id
HTTP 400

# Verify 404 when file not found
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/userfiles/download?userfileid=472df010-e3df-48d0-9cb6-7b28022ab045&version=1734112100
HTTP 404

# Verify 400 when invalid userfileid format
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/userfiles/download?userfileid=my-bad-id&version=1734112100
HTTP 400
