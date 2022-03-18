package controller

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/cognito"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

// SignupRequest struct
type SignUpRequest struct {
	FirstName string `json:"firstname"`
	LastName  string `json:"lastname"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	Password  string `json:"password"`
}

type ForgotPasswordRequest struct {
	Username string
}
type DeleteUserRequest struct {
	Username string
}
type ConfirmForgotPasswordRequest struct {
	Username         string
	ConfirmationCode string
	NewPassword      string
}

type ConfirmSignupRequest struct {
	Username string
	Code     string
}

type SignupResponse struct {
	UserSub string `json:"userSub"`
}
type MsgResponse struct {
	Msg string `json:"msg"`
}

// TODO: update with env variables
var cognitoClient = cognito.NewCognitoClient(os.Getenv("AWS_REGION"), os.Getenv("COGNITO_CLIENT_ID"))

func returnError(w http.ResponseWriter, r *http.Request, err error, prefix string) {
	msg := prefix + err.Error()
	logger.LogWithTrace(r, msg, logger.ERROR)
	http.Error(w, msg, http.StatusInternalServerError)
}

// Good
func Signup(w http.ResponseWriter, r *http.Request) {
	// 1. Parse the request object.
	var signUpRequest SignUpRequest
	err := json.NewDecoder(r.Body).Decode(&signUpRequest)
	if err != nil {
		returnError(w, r, err, "Invalid request format: ")
		return
	}

	if signUpRequest.Email == "" {
		returnError(w, r, errors.New("email field missing"), "")
		return
	}
	if signUpRequest.Username == "" {
		returnError(w, r, errors.New("username field missing"), "")
		return
	}
	if signUpRequest.Password == "" {
		returnError(w, r, errors.New("password field missing"), "")
		return
	}

	// 2. Add user to cognito
	result, error := cognitoClient.SignUp(signUpRequest.Username, signUpRequest.Email, signUpRequest.Password)

	if error != nil {
		returnError(w, r, error, "")
		return
	}

	// 3. add User to Site's users (We might want to move this part to ConfirmSignup)
	s := middleware.GetSession(r)
	site := s.GetSite()
	User := &auth.AuthenticationClaims{
		Username:  signUpRequest.Username,
		FirstName: signUpRequest.FirstName,
		LastName:  signUpRequest.LastName,
	}

	er := auth.CreateUser(User, site)

	if er != nil {
		returnError(w, r, er, "")
	}

	respondJSON(w, r, &SignupResponse{
		UserSub: *result.UserSub,
	})
}

func ConfirmSignup(w http.ResponseWriter, r *http.Request) {
	var confirmSignupRequest ConfirmSignupRequest
	err := json.NewDecoder(r.Body).Decode(&confirmSignupRequest)
	if err != nil {
		returnError(w, r, err, "Invalid request format: ")
		return
	}

	error := cognitoClient.ConfirmSignup(confirmSignupRequest.Username, confirmSignupRequest.Code)

	if error != nil {
		returnError(w, r, error, "")
		return
	}

	respondJSON(w, r, &MsgResponse{
		Msg: "user confirmed",
	})
}

func ForgotPassword(w http.ResponseWriter, r *http.Request) {
	// 1. Parse the request object.
	var forgotPasswordRequest ForgotPasswordRequest
	err := json.NewDecoder(r.Body).Decode(&forgotPasswordRequest)
	if err != nil {
		returnError(w, r, err, "Invalid request format: ")
		return
	}

	_, error := cognitoClient.ForgotPassword(forgotPasswordRequest.Username)

	if error != nil {
		returnError(w, r, error, "")
		return
	}

	respondJSON(w, r, &MsgResponse{
		Msg: "email sent",
	})
}

func ConfirmForgotPassword(w http.ResponseWriter, r *http.Request) {
	// 1. Parse the request object.
	var requestData ConfirmForgotPasswordRequest
	err := json.NewDecoder(r.Body).Decode(&requestData)
	if err != nil {
		returnError(w, r, err, "Invalid request format: ")
		return
	}

	error := cognitoClient.ConfirmForgotPassword(
		requestData.Username,
		requestData.ConfirmationCode,
		requestData.NewPassword,
	)

	if error != nil {
		returnError(w, r, error, "")
		return
	}

	respondJSON(w, r, &MsgResponse{
		Msg: "Password Reset",
	})
}
func Delete(w http.ResponseWriter, r *http.Request) {
	// 1. Parse the request object.
	var d DeleteUserRequest
	err := json.NewDecoder(r.Body).Decode(&d)
	if err != nil {
		returnError(w, r, err, "Invalid request format: ")
		return
	}

	error := cognitoClient.DeleteUser(
		d.Username,
	)

	if error != nil {
		returnError(w, r, error, "")
		return
	}

	s := middleware.GetSession(r)
	site := s.GetSite()
	User := &auth.AuthenticationClaims{
		Username: d.Username,
	}

	er := auth.DeleteUser(User, site)

	if er != nil {
		returnError(w, r, er, "")
	}

	respondJSON(w, r, &MsgResponse{
		Msg: "User deleted",
	})
}
