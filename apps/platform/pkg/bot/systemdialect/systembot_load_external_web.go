package systemdialect

import (
	"encoding/json"
	"errors"
	"fmt"
	v3 "github.com/pb33f/libopenapi/datamodel/high/v3"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	httpClient "github.com/thecloudmasters/uesio/pkg/http"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/openapi"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"io"
	"net/http"
	"net/url"
	"strings"
)

type RestCollectionMetadata struct {
	LoadOperation    string `json:"loadOperationId"`
	LoadResponsePath string `json:"loadResponsePath"`
	InsertOperation  string `json:"insertOperationId"`
	CreateOperation  string `json:"createOperationId"`
	DeleteOperation  string `json:"deleteOperationId"`
}

func loadExternalWebIntegration(op *adapt.LoadOp, connection adapt.Connection, session *sess.Session) error {

	// The op should have integration metadata attached already
	integration, err := op.GetIntegration()
	if err != nil {
		return err
	}

	var creds *meta.Credential

	// Get the credentials off of the integration
	if integration.Credentials != "" {
		credsNS, credsName, credsErr := meta.ParseKey(integration.Credentials)
		if credsErr != nil {
			return errors.New("Invalid credentials specified for integration: " + integration.Credentials)
		}
		creds = meta.NewBaseCredential(credsNS, credsName)
		if loadErr := bundle.Load(creds, session, connection); loadErr != nil {
			return errors.New("requested integration credentials not found: " + integration.Credentials)
		}
	}

	if err != nil {
		return err
	}

	// The op should have data source collection metadata attached already
	collectionMetadata, err := op.GetCollectionMetadata()
	if err != nil {
		return err
	}

	// Deserialize custom metadata off of the collection
	collectionCustomMeta := collectionMetadata.CustomMetadata
	if collectionCustomMeta == "" {
		return errors.New("no web metadata found for collection: " + collectionMetadata.Name)
	}
	restMetadata := &RestCollectionMetadata{}
	err = json.Unmarshal([]byte(collectionCustomMeta), restMetadata)
	if err != nil {
		return errors.New("invalid format for custom metadata for collection: " + collectionMetadata.Name + ": " + err.Error())
	}
	if restMetadata.LoadOperation == "" {
		return errors.New("no load operation defined for collection: " + collectionMetadata.Name)
	}
	spec, err := openapi.LoadModelFromIntegration(integration)

	// Find the requested Operation
	var loadOperation *v3.Operation
	var loadPath, loadMethod string
	for path, pathItem := range spec.Paths.PathItems {
		// Check the GET endpoint first, it's the most likely match
		if pathItem.Get != nil && pathItem.Get.OperationId == restMetadata.LoadOperation {
			loadOperation = pathItem.Get
			loadPath = path
			loadMethod = "GET"
			break
		}
		// Check the POST endpoint next
		if pathItem.Post != nil && pathItem.Post.OperationId == restMetadata.LoadOperation {
			loadOperation = pathItem.Post
			loadPath = path
			loadMethod = "POST"
			break
		}
	}

	if loadOperation == nil {
		return errors.New("could not find the requested load operation on collection: " + collectionMetadata.Name)
	}
	// Index all load request conditions by id so that we can grab their values
	conditionsById := map[string]*adapt.LoadRequestCondition{}

	for _, condition := range op.Conditions {
		if condition.ID != "" {
			conditionsById[condition.ID] = &condition
		}
	}

	// Process parameters needed for the request
	headerParams := map[string]string{}

	// TODO: Add the base url from... the "servers" list???
	// NO --- from the integration. Use Integration instead of Data Source...
	queryString := url.Values{}

	if len(loadOperation.Parameters) > 0 {
		for _, param := range loadOperation.Parameters {
			condition := conditionsById[param.Name]
			if condition == nil && param.Required {
				return errors.New("required condition " + param.Name + " not found in load request")
			} else if condition != nil && param.AllowEmptyValue == false && (condition.Value == nil || condition.Value == "") {
				return errors.New("no value provided for required condition " + param.Name + ", could not perform load")
			}
			// Otherwise, if there's no condition, we can move on
			if condition == nil {
				continue
			}
			paramVal := fmt.Sprintf("%v", condition.Value)
			if param.In == "header" {
				headerParams[param.Name] = paramVal
			} else if param.In == "path" {
				// Populate values in the path from named load request conditions
				loadPath = strings.Replace(loadPath, fmt.Sprintf("{%s}", param.Name), paramVal, 1)
			} else if param.In == "query" {
				queryString.Set(param.Name, paramVal)
			} else if param.In == "cookie" {
				// TODO: Build up a cookie header
			}
		}
	}

	// Process credentials
	if creds != nil {

	}

	// Okay, we should be ready to go!
	httpReq, err := http.NewRequest(loadMethod, loadPath+"?"+queryString.Encode(), nil)
	if err != nil {
		return errors.New("unable to load construct HTTP request for load: " + err.Error())
	}

	// TODO: Add in common request headers!
	if len(headerParams) > 0 {
		for headerName, headerValue := range headerParams {
			httpReq.Header.Set(headerName, headerValue)
		}
	}
	// TODO: Handle Security Schemes...

	httpResp, err := httpClient.Get().Do(httpReq)
	if err != nil {
		return errors.New("unable to load data from HTTP API: " + err.Error())
	}

	var responseData []byte
	var responseError error

	if httpResp.Body != nil {
		defer httpResp.Body.Close()
		// Read the full body into a byte array, so we can cache / parse
		responseData, responseError = io.ReadAll(httpResp.Body)
		if responseError != nil {
			return errors.New("unable to read HTTP response body: " + responseError.Error())
		}
	}

	contentType := httpResp.Header.Get("Content-Type")

	// Inspect the response schema for the operation and translate the response accordingly
	// into a structured representation so that we can build up collection items

	if responseData != nil {
		// First try to parse response data using the OpenAPI metadata
		err = openapi.ParseResponseBodyUsingApiMetadata(op.Collection, responseData, contentType, httpResp.StatusCode, loadOperation.Responses, spec)

		// Fallback to manually trying to parse the response body using JSON introspection
		if err != nil {
			err = openapi.ParseResponseBodyUsingBestGuess(op.Collection, responseData, contentType, integration)
		}
		if err != nil {
			return errors.New("unable to parse response body: " + err.Error())
		}
		// Otherwise --- we should have some data now
		return nil
	}

	return nil
}
