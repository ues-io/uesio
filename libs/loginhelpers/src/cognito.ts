import {
	AuthenticationDetails,
	CognitoUserPool,
	CognitoUser,
	CognitoUserAttribute,
} from "amazon-cognito-identity-js"

const getPool = (userPoolId: string, clientId: string): CognitoUserPool =>
	new CognitoUserPool({
		UserPoolId: userPoolId, // Your user pool id here
		ClientId: clientId, // Your client id here
	})

const getUser = (username: string, pool: CognitoUserPool): CognitoUser =>
	new CognitoUser({
		Username: username,
		Pool: pool,
	})

const getAuthDetails = (
	username: string,
	password: string
): AuthenticationDetails =>
	new AuthenticationDetails({
		Username: username,
		Password: password,
	})

const getAttributeList = (
	email: string,
	lastname: string,
	firstname: string
) => [
	new CognitoUserAttribute({
		Name: "email",
		Value: email,
	}),
	new CognitoUserAttribute({
		Name: "family_name",
		Value: lastname,
	}),
	new CognitoUserAttribute({
		Name: "given_name",
		Value: firstname,
	}),
]

export { getPool, getUser, getAuthDetails, getAttributeList }
