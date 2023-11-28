package controller

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/meta"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func CallListenerBot(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	var params map[string]interface{}

	// Currently we accept params only as form data or JSON
	contentType := r.Header.Get(contentTypeHeader)

	if strings.Contains(contentType, "application/x-www-form-urlencoded") {
		params = map[string]interface{}{}
		// ParseForm must be called in order for r.Form to contain any parsed form data variables
		if err := r.ParseForm(); err != nil {
			msg := "Unable to parse form data: " + err.Error()
			slog.Error(msg)
			http.Error(w, msg, http.StatusBadRequest)
			return
		}
		for param, values := range r.Form {
			params[param] = values[0]
		}
	} else {
		err := json.NewDecoder(r.Body).Decode(&params)
		if err != nil {
			msg := "Invalid request format: " + err.Error()
			slog.Error(msg)
			http.Error(w, msg, http.StatusBadRequest)
			return
		}
	}

	session := middleware.GetSession(r)

	returnParams, err := datasource.CallListenerBotInTransaction(namespace, name, params, session)
	if err != nil {
		var statusCode int
		switch err.(type) {
		case *meta.BotParamValidationError, *meta.BotExecutionError:
			statusCode = http.StatusBadRequest
		case *meta.BotAccessError:
			statusCode = http.StatusForbidden
		case *datasource.SystemBotNotFoundError, *meta.BotNotFoundError:
			statusCode = http.StatusNotFound
		default:
			statusCode = http.StatusInternalServerError
		}
		errMessage := err.Error()
		if statusCode == http.StatusInternalServerError {
			// Best practice - don't display internal server error details to users
			errMessage = http.StatusText(http.StatusInternalServerError)
			slog.Error(err.Error())
		}
		http.Error(w, errMessage, statusCode)
		return
	}

	file.RespondJSON(w, r, &bot.BotResponse{
		Params:  returnParams,
		Success: true,
	})
}
