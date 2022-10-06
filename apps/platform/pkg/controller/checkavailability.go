package controller

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func CheckAvailability(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()

	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]
	testUsername := vars["username"]

	user, err := auth.CheckAvailability(namespace, name, testUsername, site)
	if user != nil && err == nil {
		msg := "Username not available, try something more creative"
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

}
