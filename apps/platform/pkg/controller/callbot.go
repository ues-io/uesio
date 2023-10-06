package controller

import (
	"encoding/json"
	"net/http"

	"github.com/thecloudmasters/uesio/pkg/controller/bot"
	"github.com/thecloudmasters/uesio/pkg/controller/file"
	"github.com/thecloudmasters/uesio/pkg/meta"

	"github.com/gorilla/mux"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/middleware"
)

func CallListenerBot(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	namespace := vars["namespace"]
	name := vars["name"]

	var params map[string]interface{}
	err := json.NewDecoder(r.Body).Decode(&params)
	if err != nil {
		msg := "Invalid request format: " + err.Error()
		logger.Log(msg, logger.ERROR)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	session := middleware.GetSession(r)

	returnParams, err := datasource.CallListenerBot(namespace, name, params, nil, session)
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
			logger.LogError(err)
		}
		http.Error(w, errMessage, statusCode)
		return
	}

	file.RespondJSON(w, r, &bot.BotResponse{
		Params:  returnParams,
		Success: true,
	})
}
