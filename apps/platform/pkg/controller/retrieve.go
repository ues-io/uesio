package controller

import (
	"fmt"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
)

func Retrieve(w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s.zip\"", "retrieve"))
	if err := retrieve.Retrieve(w, session); err != nil {
		HandleError(w, err)
		return
	}

}
