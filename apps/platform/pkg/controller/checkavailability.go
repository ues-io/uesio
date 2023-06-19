package controller

import (
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func CheckAvailability(w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	site := session.GetSite()

	vars := mux.Vars(r)
	testUsername := vars["username"]

	user, err := auth.CheckAvailability(getSignupMethodID(mux.Vars(r)), testUsername, site)

	if user == nil && err != nil && !strings.HasPrefix(err.Error(), "Couldn't find item from platform load") {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if user != nil && err == nil {
		msg := "Username not available, try something more creative"
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

}
