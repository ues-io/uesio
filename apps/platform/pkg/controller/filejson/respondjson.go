package filejson

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
)

func RespondJSON(w http.ResponseWriter, r *http.Request, v interface{}) {
	w.Header().Set("content-type", "text/json")
	if err := json.NewEncoder(w).Encode(v); err != nil {
		ctlutil.HandleError(w, err)
		return
	}
}
