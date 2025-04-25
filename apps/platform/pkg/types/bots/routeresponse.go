package bots

import "net/http"

// RouteResponse allows for Route Bots to return a custom response payload
// or redirect to a different URL
type RouteResponse struct {
	StatusCode    int
	Headers       http.Header
	Body          any
	RedirectURL   string
	RedirectRoute string
	Params        map[string]any
}

func NewRouteResponse() *RouteResponse {
	return &RouteResponse{
		StatusCode:    200,
		Headers:       map[string][]string{},
		Body:          nil,
		RedirectURL:   "",
		RedirectRoute: "",
		Params:        nil,
	}
}
