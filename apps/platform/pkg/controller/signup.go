package controller

import (
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"text/template"

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

	var payload map[string]string
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

	if !matchesRegex(username, signupMethod.Regex) {
		msg := "Signup failed: Regex validation failed"
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	err = authconn.Signup(payload, username, publicSession)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	claims, err := authconn.Login(payload, publicSession)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	err = auth.CreateUser(username, claims, signupMethod, publicSession)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	user, err := auth.GetUserByID(username, publicSession)
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

	var redirectNamespace, redirectRoute string

	landingRoute := signupMethod.LandingRoute
	if landingRoute == "" {
		msg := "No Landing Route Specfied"
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	redirectNamespace, redirectRoute, err = meta.ParseKey(landingRoute)
	if err != nil {
		msg := "Signup failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, r, &LoginResponse{
		User: &UserMergeData{
			ID:        user.ID,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Profile:   user.Profile,
			PictureID: user.GetPictureID(),
			Site:      session.GetSite().ID, //TO-DO Not sure what site
			Language:  user.Language,
		},
		RedirectRouteNamespace: redirectNamespace,
		RedirectRouteName:      redirectRoute,
		//RedirectPath:           redirectPath,
	})

}

func mergeTemplate(payload map[string]string, usernameTemplate string) (string, error) {
	//TO-DO add default
	template, err := newTemplateWithValidKeysOnly(usernameTemplate)
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

func newTemplateWithValidKeysOnly(templateString string) (*template.Template, error) {
	return templating.NewWithFunc(templateString, func(m map[string]string, key string) (interface{}, error) {
		val, ok := m[key]
		if !ok {
			return nil, errors.New("missing key " + key)
		}
		return val, nil
	})
}
