package datasource

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/checkout/session"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/secretstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func queryDomainFromSite(siteID string) (*meta.SiteDomain, error) {
	var sd meta.SiteDomain
	err := PlatformLoadOne(
		&sd,
		&PlatformLoadOptions{
			Fields: []adapt.LoadRequestField{
				{
					ID: "uesio/studio.domain",
				},
				{
					ID: "uesio/studio.type",
				},
			},
			Conditions: []adapt.LoadRequestCondition{
				{
					Field: "uesio/studio.site",
					Value: siteID,
				},
			},
			BatchSize: 1,
		},
		sess.GetStudioAnonSession(),
	)
	if err != nil {
		return nil, err
	}
	return &sd, nil
}

func getHostFromDomain(domain *meta.SiteDomain, site *meta.Site) string {
	if domain.Type == "subdomain" {
		return fmt.Sprintf("https://%s.%s", domain.Domain, site.Domain)
	}
	return fmt.Sprintf("https://%s", domain.Domain)
}

func runMakePaymentListenerBot(params map[string]interface{}, connection adapt.Connection, uesioSession *sess.Session) (map[string]interface{}, error) {

	//stripe.Key = "sk_test_51MC1MmJKdGn0ZDEEKE3oc9O0YUz9bJMYNaABNf4perGEycxtHmRuqXpnUyA4vbuXwcN9hwJMSEt6E2mJCNGeuzBN00eic9IQ1m"
	//productID := "prod_MwHe3fVLMi0pcj"

	//BOT Start

	userID := uesioSession.GetUserID()
	site := uesioSession.GetSite()

	domain, err := queryDomainFromSite(site.ID)
	if err != nil {
		return nil, err
	}

	host := getHostFromDomain(domain, site)
	cancelURL := fmt.Sprintf("%s/%s", host, "mypayments")
	successURL := fmt.Sprintf("%s/%s/{CHECKOUT_SESSION_ID}", host, "paymentsuccess")

	anonSession := sess.GetStudioAnonSession()
	stripeKey, err := secretstore.GetSecretFromKey("uesio/studio.stripe_key", anonSession)
	if err != nil {
		return nil, err
	}

	stripe.Key = stripeKey

	productID, err := configstore.GetValueFromKey("uesio/studio.stripe_product_id", anonSession)
	if err != nil {
		return nil, err
	}

	amount, err := strconv.ParseInt(params["price"].(string), 10, 64)
	if err != nil {
		return nil, errors.New("Can't get price")
	}

	priceData := &stripe.CheckoutSessionLineItemPriceDataParams{
		Product:    stripe.String(productID),
		UnitAmount: stripe.Int64(amount * 100),
		Currency:   stripe.String("usd"),
	}

	oneTimePayment := &stripe.CheckoutSessionParams{
		ClientReferenceID: stripe.String(userID),
		PaymentMethodTypes: stripe.StringSlice([]string{
			"card",
		}),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Quantity:  stripe.Int64(1),
				PriceData: priceData, // To create an inline price use case, pass in price_data instead of a price.id
			},
		},
		Mode: stripe.String(string(stripe.CheckoutSessionModePayment)),
		//SuccessURL: stripe.String("https://example.com/success?session_id={CHECKOUT_SESSION_ID}"),
		SuccessURL: stripe.String(successURL),
		CancelURL:  stripe.String(cancelURL),
	}

	checkoutSession, err := session.New(oneTimePayment)
	if err != nil {
		return nil, err
	}

	returnParams := map[string]interface{}{"redirectUrl": checkoutSession.URL, "checkoutSessionID": checkoutSession.ID}

	return returnParams, nil

}
