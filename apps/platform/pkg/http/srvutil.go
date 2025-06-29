package http

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

const (
	TRAILER_UESIO_STATUS_CODE_KEY     = "X-UESIO-STATUS-CODE"
	TRAILER_UESIO_STATUS_MESSAGE_KEY  = "X-UESIO-STATUS-MESSAGE"
	TRAILER_UESIO_STATUS_CODE_SUCCESS = "0"
)

func HandleError(ctx context.Context, w http.ResponseWriter, err error) {
	statusCode := exceptions.GetStatusCodeForError(err)
	var errMessage string
	if statusCode == http.StatusInternalServerError {
		// Best practice - don't display internal server error details to users,
		// but log it server-side so that dev team can review
		errMessage = http.StatusText(statusCode)
	} else {
		errMessage = err.Error()
	}
	http.Error(w, errMessage, statusCode)
}

func HandleTrailingError(ctx context.Context, w http.ResponseWriter, err error) {
	statusCode := exceptions.GetStatusCodeForError(err)
	var errMessage string
	if statusCode == http.StatusInternalServerError {
		// Best practice - don't display internal server error details to users,
		// but log it server-side so that dev team can review
		errMessage = http.StatusText(statusCode)
	} else {
		errMessage = err.Error()
	}
	w.Header().Set(TRAILER_UESIO_STATUS_CODE_KEY, strconv.Itoa(statusCode))
	w.Header().Set(TRAILER_UESIO_STATUS_MESSAGE_KEY, errMessage)
}

func AddTrailingStatus(ctx context.Context, w http.ResponseWriter) {
	w.Header().Set("Trailer", fmt.Sprintf("%s, %s", TRAILER_UESIO_STATUS_CODE_KEY, TRAILER_UESIO_STATUS_MESSAGE_KEY))
}
