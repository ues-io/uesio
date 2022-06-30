package controller

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func CheckAvailability(w http.ResponseWriter, r *http.Request) {

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
	testUsername := vars["username"]

	signupMethod := &meta.SignupMethod{
		Name:      name,
		Namespace: namespace,
	}

	err := bundle.Load(signupMethod, publicSession)
	if err != nil {
		msg := "Test Username failed: " + err.Error()
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	payload := map[string]interface{}{"username": testUsername}

	username, err := mergeTemplate(payload, signupMethod.UsernameTemplate)
	if err != nil {
		msg := "Test Username failed: " + err.Error()
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	if !matchesRegex(username, signupMethod.UsernameRegex) {
		msg := "Regex validation failed"
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	user, err := auth.GetUserByKey(username, publicSession, nil)

	if user != nil && err == nil {
		msg := "Username not available, try something more creative"
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

}
