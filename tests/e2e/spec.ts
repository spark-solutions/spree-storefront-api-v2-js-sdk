// To import @spree/storefront-api-v2-sdk, run 'npm link' and 'npm link @spree/storefront-api-v2-sdk'
// in the project's root directory.
import { Client, makeClient, result } from '@spree/storefront-api-v2-sdk'
import { RelationType } from '@spree/storefront-api-v2-sdk/types/interfaces/Relationships'

const createTests = function () {
  it('completes guest order', function () {
    const { orderFullAddress } = this
    const client: Client = this.client

    cy.wrap(null)
      .then(function () {
        return client.cart.create()
      })
      .then(function (cartCreateResponse) {
        const { token: orderToken, number: orderNumber } = cartCreateResponse.success().data.attributes

        return cy
          .wrap(null)
          .then(function () {
            return client.cart.addItem({ orderToken }, { variant_id: '1', quantity: 1 })
          })
          .then(function () {
            return client.checkout.orderUpdate({ orderToken }, { order: orderFullAddress })
          })
          .then(function () {
            return client.checkout.shippingMethods({ orderToken })
          })
          .then(function (shippingResponse) {
            const firstShipment = shippingResponse.success().data[0]

            return client.checkout.orderUpdate(
              { orderToken },
              {
                order: {
                  payments_attributes: [
                    {
                      payment_method_id: '3'
                    }
                  ],
                  shipments_attributes: [
                    {
                      id: firstShipment.id,
                      selected_shipping_rate_id: (firstShipment.relationships.shipping_rates.data as RelationType[])[0]
                        .id
                    }
                  ]
                }
              }
            )
          })
          .then(function () {
            return client.checkout.complete({ orderToken })
          })
          .then(function (orderCompleteResponse) {
            expect(orderCompleteResponse.isSuccess()).to.be.true
          })
          .then(function () {
            return client.order.status({ orderToken }, orderNumber)
          })
          .then(function (statusResponse) {
            expect(statusResponse.isSuccess()).to.be.true
          })
      })
  })

  it('shows cart', function () {
    const client: Client = this.client

    cy.wrap(null)
      .then(function () {
        return client.cart.create()
      })
      .then(function (cartCreateResponse) {
        const orderToken = cartCreateResponse.success().data.attributes.token

        return client.cart.show({ orderToken })
      })
      .then(function (cartShowResponse) {
        expect(cartShowResponse.isSuccess()).to.be.true
      })
  })

  it('lists payment methods', function () {
    const client: Client = this.client

    cy.wrap(null)
      .then(function () {
        return client.cart.create()
      })
      .then(function (cartCreateResponse) {
        const orderToken = cartCreateResponse.success().data.attributes.token

        return cy
          .wrap(null)
          .then(function () {
            return client.checkout.paymentMethods({ orderToken })
          })
          .then(function (paymentMethodsResponse) {
            expect(paymentMethodsResponse.isSuccess()).to.be.true
          })
      })
  })
}

describe('using Spree SDK', function () {
  before(function () {
    cy.fixture('order-full-address').as('orderFullAddress')
  })

  describe('server version (i.e. CJS module) in the browser', function () {
    beforeEach(function () {
      const client = makeClient({ host: 'http://spree:3000' })

      cy.wrap(client).as('client')
    })

    createTests()
  })

  describe('client version (window global) in the browser', function () {
    beforeEach(function () {
      cy.readFile('/sdk/dist/client/index.js').then(function (spreeClientScript) {
        cy.intercept('/SpreeClientSpecialPath', spreeClientScript)
        cy.document().then((document) => {
          const scriptElement = document.createElement('script')

          scriptElement.src = '/SpreeClientSpecialPath'
          document.head.appendChild(scriptElement)

          cy.window()
            .its('SpreeSDK.makeClient')
            .then(function (makeClient) {
              const client = makeClient({ host: 'http://spree:3000' })

              cy.wrap(client).as('client')
            })
        })
      })
    })

    createTests()
  })

  describe('server (i.e. CJS module) in the server', function () {
    beforeEach(function () {
      const localClient = makeClient({ host: 'http://spree:3000' })
      const createSubProxy = function (target: any, clientMethodPath: string[]): any {
        return new Proxy(target, {
          apply: function (_target, _thisArg, argumentsList) {
            const payload = { argumentsList, clientMethodPath }

            // Send call to a mini Express server which calls Spree.
            return cy.request('http://express:3000', payload).then(function (response) {
              return result.fromJson(response.body)
            })
          },
          get: function (target: any, property: string | symbol, receiver: any) {
            if (
              typeof property === 'string' &&
              (typeof target[property] === 'object' || typeof target[property] === 'function')
            ) {
              return createSubProxy(target[property], [...clientMethodPath, property])
            }

            return Reflect.get(target, property, receiver)
          }
        })
      }
      const client = createSubProxy(localClient, [])

      cy.wrap(client).as('client')
    })

    createTests()
  })
})
