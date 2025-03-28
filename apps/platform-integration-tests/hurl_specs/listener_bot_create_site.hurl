######################################################
# Tests the crud apis for listener bots
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Should successfully create site when no password is specified
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/studio/createsite
{
  		"firstname": "createsite",
			"lastname": "user",
			"email": "createsiteuser@uesio.com",
			"subdomain": "createsite-nopwd",
			"site": "createsitenopwd",
			"version": "v0.0.1",
			"app": "uesio/tests",
			"profile": "uesio/tests.rep",
			"username": "createsiteuser",
			"signupmethod": "uesio/tests.tester"
}
HTTP 200
[Asserts]
jsonpath "$.success" == true

# Should successfully create site when password is specified
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/studio/createsite
[Options]
variable: example_valid_password=aA$09999
{
  		"firstname": "createsite",
			"lastname": "user",
			"email": "createsiteuser@uesio.com",
			"subdomain": "createsite-validpwd",
			"site": "createsitevalidpwd",
			"version": "v0.0.1",
			"app": "uesio/tests",
			"profile": "uesio/tests.rep",
			"username": "createsiteuser",
			"signupmethod": "uesio/tests.tester",
      "password": "{{example_valid_password}}"
}
HTTP 200
[Asserts]
jsonpath "$.success" == true

# Should fail when payload empty
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/studio/createsite
{
}
HTTP 400

# Should successfully create site when password does not meet min requirements
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/bots/call/uesio/studio/createsite
[Options]
variable: example_weak_password=a
{
  		"firstname": "createsite",
			"lastname": "user",
			"email": "createsiteuser@uesio.com",
			"subdomain": "createsite-invalidpwd",
			"site": "createsiteinvalidpwd",
			"version": "v0.0.1",
			"app": "uesio/tests",
			"profile": "uesio/tests.rep",
			"username": "createsiteuser",
			"signupmethod": "uesio/tests.tester",
      "password": "{{example_weak_password}}"
}
HTTP 400
[Asserts]
body contains "does not meet the password policy requirements"
