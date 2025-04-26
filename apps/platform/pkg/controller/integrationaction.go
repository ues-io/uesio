package controller

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bot"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/controller/filejson"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/integ"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/types/exceptions"
)

type RunIntegrationActionResponse struct {
}

func RunIntegrationAction(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	// The Integration namespace/name
	namespace := vars["namespace"]
	name := vars["name"]
	integrationId := fmt.Sprintf("%s.%s", namespace, name)
	// The action's name, or fully-qualified metadata key
	actionKey := r.URL.Query().Get("action")
	if actionKey == "" {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("action parameter is required", nil))
		return
	}

	params, err := getParamsFromRequestBody(r)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	session := middleware.GetSession(r)
	connection, err := datasource.GetPlatformConnection(session, nil)
	if err != nil {
		ctlutil.HandleError(w, fmt.Errorf("unable to obtain platform connection: %w", err))
		return
	}

	ic, err := datasource.GetIntegrationConnection(integrationId, session, connection)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	result, err := datasource.RunIntegrationAction(ic, actionKey, params, connection)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	// If the type is a Stream, stream chunks from it to the client
	switch v := result.(type) {
	case *integ.Stream:
		w.Header().Set("Connection", "Keep-Alive")
		// Set an initial content type to prevent GZIP handler from buffering,
		// to allow streaming responses to be sent
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Transfer-Encoding", "chunked")
		if flusher, isOk := w.(http.Flusher); isOk {
			flusher.Flush()
		}
		ctx, cancel := context.WithCancel(r.Context())
		defer cancel()

		streamErrorHandler := func(w http.ResponseWriter, err error) {
			statusCode := exceptions.GetStatusCodeForError(err)
			errMessage := err.Error()
			if statusCode == http.StatusInternalServerError {
				errMessage = http.StatusText(statusCode)
			}
			// Write a special response body that the client can interpret
			// as an error by the client while reading chunks
			// TODO: Consider using HTTP Trailers instead
			w.Write([]byte("-----ERROR-----" + errMessage + "-----ENDERROR-----"))
			w.WriteHeader(statusCode)
		}

		sigTerm := make(chan os.Signal, 1)
		signal.Notify(sigTerm, syscall.SIGINT, syscall.SIGTERM)
		for {
			select {
			case streamErr := <-v.Err():
				if streamErr == nil {
					streamErr = errors.New("request terminated for unknown reason")
				}
				streamErrorHandler(w, streamErr)
				return
			case <-sigTerm:
				streamErrorHandler(w, errors.New("request cancelled"))
				return
			case <-v.Done():
				w.WriteHeader(200)
				return
			case chunk := <-v.Chunk():
				if chunk == nil {
					return
				}
				// Have to append newline to every chunk, otherwise it doesn't work as expected
				if _, err := w.Write(chunk); err != nil {
					streamErrorHandler(w, err)
					return
				}
				// Have to flush each chunk!
				if flusher, ok := w.(http.Flusher); ok {
					flusher.Flush() // Trigger "chunked" encoding and send a chunk...
				}
			case <-ctx.Done():
				return
			}
		}
	case string:
		w.Header().Set("content-type", "text/plain")
		fmt.Fprint(w, result)
	default:
		// Send the response to the client as JSON
		filejson.RespondJSON(w, r, result)
	}
}

// DescribeIntegrationAction returns metadata about an integration action.
// This can come from one of two sources:
//  1. the integration action - each action can define its params
//  2. the action's associated bot - if an action does NOT define its params,
//     the action's params will default to the associated Bot's params.
func DescribeIntegrationAction(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	// The namespace and name of the integration type
	namespace := vars["namespace"]
	name := vars["name"]
	// The action's name, or fully-qualified metadata key
	actionKey := r.URL.Query().Get("action")
	if actionKey == "" {
		ctlutil.HandleError(w, exceptions.NewBadRequestException("action parameter is required", nil))
		return
	}

	session := middleware.GetSession(r)
	connection, err := datasource.GetPlatformConnection(session, nil)
	if err != nil {
		ctlutil.HandleError(w, fmt.Errorf("unable to obtain platform connection: %w", err))
		return
	}

	// Load the integration and integration type
	integrationTypeName := fmt.Sprintf("%s.%s", namespace, name)
	integrationType, err := datasource.GetIntegrationType(integrationTypeName, session, connection)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	// The action itself MUST exist as a baseline.
	action, err := datasource.GetIntegrationAction(integrationTypeName, actionKey, session, connection)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	var actionParams meta.BotParams
	// 1. Priority 1 --- read params off of the Integration Action itself.
	if len(action.Params) > 0 {
		actionParams = action.Params
	} else {
		// 2. Fallback --- read params off of the associated Bot.
		actionBotKey, err := datasource.GetIntegrationActionBotName(action, integrationType)
		if err != nil {
			ctlutil.HandleError(w, err)
			return
		}
		actionBotNamespace, actionBotName, err := meta.ParseKey(actionBotKey)
		if err != nil {
			ctlutil.HandleError(w, err)
			return
		}
		robot := meta.NewRunActionBot(actionBotNamespace, actionBotName)
		err = bundle.Load(robot, nil, session, nil)
		if err != nil {
			ctlutil.HandleError(w, err)
			return
		}
		actionParams = robot.Params
	}

	// If we couldn't find any parameters --- return an error
	if len(actionParams) < 1 {
		ctlutil.HandleError(w, exceptions.NewNotFoundException("could not find any parameters for this action"))
		return
	}

	filejson.RespondJSON(w, r, &IntegrationActionsResponse{
		Inputs: bot.GetParamResponse(actionParams),
	})
}

type IntegrationActionsResponse struct {
	Inputs meta.BotParamsResponse `json:"inputs"`
	// TODO: Outputs and response format
}
