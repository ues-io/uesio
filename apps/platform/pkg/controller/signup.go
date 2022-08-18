package controller

import (
	"encoding/json"
	"net/http"
	"regexp"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func Signup(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()
	publicSession := sess.NewPublic(site)
	publicSession.SetPermissions(&meta.PermissionSet{
		CollectionRefs: map[string]bool{
			"uesio/core.loginmethod": true,
			"uesio/core.user":        true,
			"uesio/core.userfile":    true,
		},
	})

	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	signupMethod := &meta.SignupMethod{
		Name:      name,
		Namespace: namespace,
	}

	err := bundle.Load(signupMethod, publicSession)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	authconn, err := auth.GetAuthConnection(signupMethod.AuthSource, publicSession)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	var payload map[string]interface{}
	err = json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	username, err := mergeTemplate(payload, signupMethod.UsernameTemplate)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	if !matchesRegex(username, signupMethod.UsernameRegex) {
		msg := "Signup failed: Regex validation failed"
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	claims, err := authconn.Signup(payload, username, publicSession)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	email, _ := auth.GetPayloadValue(payload, "email")

	err = auth.CreateUser(username, email, signupMethod, publicSession)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	user, err := auth.GetUserByKey(username, publicSession, nil)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	err = auth.CreateLoginMethod(user, signupMethod, claims, publicSession)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	//Use the Guest user since the user might not be confirmed yet
	redirectResponse(w, r, signupMethod.LandingRoute, sess.GetPublicUser(site), site)

}

func mergeTemplate(payload map[string]interface{}, usernameTemplate string) (string, error) {
	template, err := templating.NewTemplateWithValidKeysOnly(usernameTemplate)
	if err != nil {
		return "", err
	}
	return templating.Execute(template, payload)
}

func matchesRegex(usarname string, regex string) bool {
	if regex == "" {
		return meta.IsValidMetadataName(usarname)
	}
	var validMetaRegex, _ = regexp.Compile(regex)
	return validMetaRegex.MatchString(usarname)
}
