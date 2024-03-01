package controller

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"

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

	var loginRequest map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&loginRequest)
	if err != nil {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("invalid login request body"))
		return
	}

	s := middleware.GetSession(r)

	auth.Login(w, r, getAuthSourceID(mux.Vars(r)), loginRequest, s)

}
