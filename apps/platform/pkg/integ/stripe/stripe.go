package stripe

import (
	"errors"
	"strings"

	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/checkout/session"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

type CheckoutItem struct {
	Name     string `json:"name"`
	Price    int64  `json:"price"`
	Quantity int64  `json:"quantity"`
}

type CheckoutOptions struct {
	Items      []CheckoutItem `json:"items"`
	SuccessURL string         `json:"successURL"`
}

type connection struct {
	apiKey      string
	integration *meta.Integration
	session     *sess.Session
}

func newStripeConnection(ic *adapt.IntegrationConnection) (*connection, error) {
	apikey, err := ic.GetCredentials().GetRequiredEntry("apikey")
	if err != nil || apikey == "" {
		return nil, errors.New("Stripe API Key not provided")
	}
	return &connection{
		apiKey:      apikey,
		integration: ic.GetIntegration(),
		session:     ic.GetSession(),
	}, nil
}

// RunAction implements the system bot interface
func RunAction(bot *meta.Bot, action *meta.IntegrationAction, ic *adapt.IntegrationConnection, params map[string]interface{}) (interface{}, error) {

	c, err := newStripeConnection(ic)
	if err != nil {
		return nil, err
	}

	switch strings.ToLower(action.Name) {
	case "checkout":
		return c.checkout(params)
	}

	return nil, errors.New("invalid action name for Stripe integration")

}

func (sic *connection) checkout(requestOptions interface{}) (interface{}, error) {

	options := &CheckoutOptions{}
	err := datasource.HydrateOptions(requestOptions, options)
	if err != nil {
		return nil, err
	}

	stripe.Key = sic.apiKey

	lineItems := make([]*stripe.CheckoutSessionLineItemParams, len(options.Items))

	for i, item := range options.Items {
		lineItems[i] = &stripe.CheckoutSessionLineItemParams{
			PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
				ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
					Name: stripe.String(item.Name),
				},
				Currency:   stripe.String("USD"),
				UnitAmount: stripe.Int64(item.Price),
			},
			Quantity: stripe.Int64(item.Quantity),
		}
	}
	params := &stripe.CheckoutSessionParams{
		LineItems:  lineItems,
		Mode:       stripe.String("payment"),
		SuccessURL: stripe.String(options.SuccessURL),
	}
	s, err := session.New(params)
	if err != nil {
		return nil, err
	}
	return s.URL, nil

}
