package systemdialect

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/stripe/stripe-go/v74"
	"github.com/stripe/stripe-go/v74/checkout/session"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func runMakePaymentListenerBot(params map[string]interface{}, connection wire.Connection, uesioSession *sess.Session) (map[string]interface{}, error) {

	amount, err := strconv.ParseInt(params["price"].(string), 10, 64)
	if err != nil {
		return nil, errors.New("Can't get price")
	}

	if amount <= 0 {
		return nil, errors.New("The amount is negative, you don't have to pay anything.")
	}

	userID := uesioSession.GetContextUser().ID
	site := uesioSession.GetSite()

	domain, err := datasource.QueryDomainFromSite(site.ID)
	if err != nil {
		return nil, err
	}

	host := datasource.GetHostFromDomain(domain, site)
	cancelURL := fmt.Sprintf("%s/mypayments", host)
	successURL := fmt.Sprintf("%s/paymentsuccess/{CHECKOUT_SESSION_ID}", host)

	anonSession := sess.GetStudioAnonSession()
	stripeKey, err := datasource.GetSecretFromKey("uesio/studio.stripe_key", anonSession)
	if err != nil {
		return nil, err
	}

	stripe.Key = stripeKey

	productData := &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
		Name: stripe.String("Uesio One Time Payment"),
	}

	priceData := &stripe.CheckoutSessionLineItemPriceDataParams{
		UnitAmount:  stripe.Int64(amount * 100),
		Currency:    stripe.String("usd"),
		ProductData: productData,
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
		Mode:       stripe.String(string(stripe.CheckoutSessionModePayment)),
		SuccessURL: stripe.String(successURL),
		CancelURL:  stripe.String(cancelURL),
	}

	checkoutSession, err := session.New(oneTimePayment)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"redirectUrl":       checkoutSession.URL,
		"checkoutSessionID": checkoutSession.ID,
	}, nil

}
