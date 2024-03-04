package controller

import (
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func getAuthSourceID(vars map[string]string) string {
	authSourceNamespace := vars["namespace"]
	authSourceName := vars["name"]
	return authSourceNamespace + "." + authSourceName
}

func Login(w http.ResponseWriter, r *http.Request) {

	s := middleware.GetSession(r)

	auth.Login(w, r, getAuthSourceID(mux.Vars(r)), s)

}

func RequestLogin(w http.ResponseWriter, r *http.Request) {

	s := middleware.GetSession(r)

	auth.RequestLogin(w, r, getAuthSourceID(mux.Vars(r)), s)

}
