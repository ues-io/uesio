package ctlutil

import (
	"log/slog"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

const (
	TRAILER_UESIO_STATUS_CODE_KEY     = "X-UESIO-STATUS-CODE"
	TRAILER_UESIO_STATUS_MESSAGE_KEY  = "X-UESIO-STATUS-MESSAGE"
	TRAILER_UESIO_STATUS_CODE_SUCCESS = "0"
)

// HandleError is a utility for returning an appropriate HTTP response code and error message
// based on a Go error, which is aware of the different Uesio exception classes defined
// in the types/exceptions package.
// This should be used in any error handling scenario within controllers, e.g.
//
//	if err := someCall(); err != nil {
//	   HandleError(w, err)
//	   return
//	}
func HandleError(w http.ResponseWriter, err error) {
	statusCode := exceptions.GetStatusCodeForError(err)
	errMessage := err.Error()
	if statusCode == http.StatusInternalServerError {
		// Best practice - don't display internal server error details to users,
		// but log it server-side so that dev team can review
		slog.Error(errMessage)
		errMessage = http.StatusText(statusCode)
	}
	http.Error(w, errMessage, statusCode)
}
