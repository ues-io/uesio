package controller

import (
	"encoding/json"
	"fmt"
	"net/http"

	// cognito "github.com/aws/aws-sdk-go/service/cognitoidentityprovider"
	"github.com/thecloudmasters/uesio/pkg/cognito"
	"github.com/thecloudmasters/uesio/pkg/logger"
)

// SignupRequest struct
type SignUpRequest struct {
	Firstname	string
	Lastname	string
	Username	string
	Email		string
	Password	string
}

type ConfirmSignupRequest struct {
	Email string
	Code string
}


// SignupResponse struct
type SignupResponse struct {
	User                   *UserMergeData `json:"user"`
	RedirectPath           string         `json:"redirectPath,omitempty"`
	RedirectRouteName      string         `json:"redirectRouteName,omitempty"`
	RedirectRouteNamespace string         `json:"redirectRouteNamespace,omitempty"`
}



func ConfirmSignup (w http.ResponseWriter, r *http.Request) {
		// 1. Parse the request object.
		var confirmSignupRequest ConfirmSignupRequest
		err := json.NewDecoder(r.Body).Decode(&confirmSignupRequest)
		if err != nil {
			msg := "Invalid request format: " + err.Error()
			logger.LogWithTrace(r, msg, logger.ERROR)
			http.Error(w, msg, http.StatusInternalServerError)
			return
		}
		// TODO: move up in scope
		cognitoClient := cognito.NewCognitoClient("us-east-2", "26a0id740pkfhn42auod0mjgtm")

		err, result := cognitoClient.ConfirmSignup(confirmSignupRequest.Email, confirmSignupRequest.Code)

		if err != nil {
			panic(err)
		}
	
		fmt.Printf("result: %v\n", result)
	}

func Signup(w http.ResponseWriter, r *http.Request) {
	
	// 1. Parse the request object.
	var signUpRequest SignUpRequest
	err := json.NewDecoder(r.Body).Decode(&signUpRequest)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	// appClientID, err := configstore.GetValueFromKey("uesio:cognito_client_id", s)
	// region, err := configstore.GetValueFromKey("uesio:aws_region", s)

	// TODO: move up in scope
	cognitoClient := cognito.NewCognitoClient("us-east-2", "26a0id740pkfhn42auod0mjgtm")

	err, result := cognitoClient.SignUp(signUpRequest.Email, signUpRequest.Password)

	if err != nil {
		panic(err)
	}

	fmt.Printf("result: %v\n", result)

// 	respondJSON(w, r, &LoginResponse{
// 		User: GetUserMergeData(session),
// 		// We'll want to read this from a setting somewhere
// 		RedirectRouteNamespace: redirectNamespace,
// 		RedirectRouteName:      redirectRoute,
// 		RedirectPath:           redirectPath,
// 	})

}
