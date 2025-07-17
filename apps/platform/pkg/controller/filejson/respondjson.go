package filejson

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
)

func RespondJSON(w http.ResponseWriter, r *http.Request, v any) {
	w.Header().Set("content-type", "application/json")
	if err := json.NewEncoder(w).Encode(v); err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
}

func RespondJSONPretty(w http.ResponseWriter, r *http.Request, v any) {
	w.Header().Set("content-type", "application/json")
	enc := json.NewEncoder(w)
	enc.SetIndent("", "    ")
	if err := enc.Encode(v); err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
}
