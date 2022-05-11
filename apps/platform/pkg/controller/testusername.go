package controller

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func TestUsername(w http.ResponseWriter, r *http.Request) {

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
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	var payload map[string]interface{}
	payload["username"] = testUsername

	username, err := mergeTemplate(payload, signupMethod.UsernameTemplate)
	if err != nil {
		msg := "Test Username failed: " + err.Error()
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	if !matchesRegex(username, signupMethod.Regex) {
		msg := "Test Username failed: Regex validation failed"
		logger.LogWithTrace(r, msg, logger.ERROR)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}

	user, err := auth.GetUserByID(username, session)

	if user != nil && err == nil {
		//username already taken

	}

	//redirectResponse(w, r, signupMethod.LandingRoute, user, site)

}
