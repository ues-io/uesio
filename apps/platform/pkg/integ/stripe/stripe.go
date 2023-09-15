package stripe

import (
	"errors"

	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/checkout/session"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/integ"
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

type StripeIntegration struct {
}

func (si *StripeIntegration) GetIntegrationConnection(integration *meta.Integration, session *sess.Session, credentials *adapt.Credentials) (integ.IntegrationConnection, error) {
	return &StripeIntegrationConnection{
		session:     session,
		integration: integration,
		credentials: credentials,
	}, nil
}

type StripeIntegrationConnection struct {
	session     *sess.Session
	integration *meta.Integration
	credentials *adapt.Credentials
}

func (sic *StripeIntegrationConnection) GetCredentials() *adapt.Credentials {
	return sic.credentials
}

func (sic *StripeIntegrationConnection) GetIntegration() *meta.Integration {
	return sic.integration
}

func (sic *StripeIntegrationConnection) RunAction(actionName string, requestOptions interface{}) (interface{}, error) {

	switch actionName {
	case "checkout":
		return sic.Checkout(requestOptions)
	}

	return nil, errors.New("Invalid Action Name for Stripe integration")

}

func (sic *StripeIntegrationConnection) Checkout(requestOptions interface{}) (interface{}, error) {

	options := &CheckoutOptions{}
	err := integ.HydrateOptions(requestOptions, options)
	if err != nil {
		return nil, err
	}

	apikey, ok := (*sic.credentials)["apikey"]
	if !ok {
		return nil, errors.New("No API Key provided")
	}

	stripe.Key = apikey

	lineItems := []*stripe.CheckoutSessionLineItemParams{}

	for _, item := range options.Items {
		lineItems = append(lineItems, &stripe.CheckoutSessionLineItemParams{
			PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
				ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
					Name: stripe.String(item.Name),
				},
				Currency:   stripe.String("USD"),
				UnitAmount: stripe.Int64(item.Price),
			},
			Quantity: stripe.Int64(item.Quantity),
		})
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
