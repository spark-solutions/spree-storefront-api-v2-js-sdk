TODO: "Try using the ESM bundle first. If you have problems with it or you need to support old browsers or old versions of NodeJS, switch to UMD."

TODO: "Spree SDK's bundles (inside /dist) rely on third-party libraries. These are not included within bundles. You need to include `axios` and `qs` to the project on your own. Depending on how you build your project, they will be installed automatically by npm/yarn based on information in the SDK's package.json file or you'll need to fetch them via `&lt;script&gt;` tags. Both, `&lt;script src=...` and `&lt;script type='module' src=...` variants are supported."

TODO: Test `&lt;script type='module' src=...`

# Spree Commerce Storefront API v2 JavaScript / TypeScript SDK

Node module to easily integrate your JavaScript or TypeScript application with [Spree API V2](https://guides.spreecommerce.org/api/v2). You can create an entirely custom Storefront in JS/TS with this package including one page checkout, Single Page Apps, PWAs and so on.

Developed and maintained by:

[![Spark Solutions](http://sparksolutions.co/wp-content/uploads/2015/01/logo-ss-tr-221x100.png)][spark]

Сontents:

- [Quick Start](#quick-start)
- [Response schema](#response-schema)
  - [Success schema](#success-schema)
  - [Error schema](#error-schema)
- [Endpoints](#endpoints)
  - [Authentication](#authentication)
    - [getToken](#getToken)
    - [refreshToken](#refreshToken)
  - [Account](#account)
    - [create](#create)
    - [forgotPassword](#forgotPassword)
    - [resetPassword](#resetPassword)
    - [update](#update)
    - [accountInfo](#accountInfo)
    - [creditCardsList](#creditCardsList)
    - [defaultCreditCard](#defaultCreditCard)
    - [completedOrdersList](#completedOrdersList)
    - [completedOrder](#completedOrder)
    - [addressesList](#addressesList)
    - [showAddress](#showAddress)
    - [createAddress](#createaddress)
    - [updateAddress](#updateaddress)
    - [removeAddress](#removeaddress)
  - [Order](#order)
    - [status](#status)
  - [Cart](#cart)
    - [create](#create-1)
    - [show](#show)
    - [addItem](#addItem)
    - [setQuantity](#setQuantity)
    - [removeItem](#removeItem)
    - [emptyCart](#emptyCart)
    - [applyCouponCode](#applyCouponCode)
    - [removeCouponCode](#removeCouponCode)
  - [Checkout](#checkout)
    - [orderUpdate](#orderUpdate)
    - [orderNext](#orderNext)
    - [advance](#advance)
    - [complete](#complete)
    - [addStoreCredits](#addStoreCredits)
    - [removeStoreCredits](#removeStoreCredits)
    - [paymentMethods](#paymentMethods)
    - [shippingMethods](#shippingMethods)
  - [Products](#products)
    - [list](#list)
    - [show](#show-1)
  - [Taxons](#taxons)
    - [list](#list-1)
    - [show](#show-2)
  - [Checkout Flow](#checkout-flow)
    - [One step](#one-step)
    - [Three steps](#three-steps)

## Quick start

Install the NPM package:

```
npm install @spree/storefront-api-v2-sdk --save
```

Create a client:

```js
import { makeClient } from '@spree/storefront-api-v2-sdk'
// When using the SDK in a <script> tag or as part of a Webpack bundle
// targeted for the browser, instead use:
// import { makeClient } from '@spree/storefront-api-v2-sdk/dist/client'

const client = makeClient({
  host: 'http://localhost:3000'
})
```

TypeScript definitions are included in the module and should be automatically used by any editor that supports them.

`client` allows calling Spree methods, ex.:

```js
client.products.list({
  include: 'default_variant',
  page: 1
})
```

The SDK is also hosted by the [UNPKG][7] CDN. [Follow this link to download version 4.5.1][5] and [this link to download the newest version][6]. Include the SDK on a website like so:

```html
<!-- Fetch axios and qs libraries first. -->
<script src="https://unpkg.com/axios/dist/axios.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qs/6.5.1/qs.min.js"></script>
<!-- Fetch the Spree SDK. -->
<script src="https://unpkg.com/@spree/storefront-api-v2-sdk@4.5.1/dist/client/index.js"></script>

<script>
  const client = window.SpreeSDK.makeClient({
    host: 'http://localhost:3000'
  })
  // ...
</script>
```

## Response schema

### Success schema

`Client` methods return a result object. When a request succeeds, the data received from Spree is retrievable using its `success()` method and provided in the [JSON:API][4] format. `isSuccess()` tells if a request succeeded.

### Error schema

The SDK avoids throwing JavaScript [`Error`s][1]. Instead, any error is included in a result object.

To determine whether a call was successful, use `isSuccess()` or `isFail()` methods on the result. Details of a failed call can be retrieved using `fail()`. The method returns a `SpreeSDKError` instance, which is the primary type for all errors returned by the SDK and extends the native JavaScript `Error` type.

Available `SpreeSDKError` subtypes:

| Class Name              | Purpose                                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MisconfigurationError` | Signifies the SDK's `Client` was created with improper options. Make sure the values of `host` and other options (if any) provided to `Client` have the correct format.                                                                                                                                                                    |
| `NoResponseError`       | Spree store could not be reached. Ensure it's running and available under the `host` address provided to the `Client` instance.                                                                                                                                                                                                            |
| `SpreeError`            | Spree responded with an error. To debug the issue, check the error's `serverResponse` field. It contains details about the response from Spree, such as the HTTP status code and headers.                                                                                                                                                  |
| `BasicSpreeError`       | Extends `SpreeError` with a `summary` field provided by Spree and containing a summary of the issue.                                                                                                                                                                                                                                       |
| `ExpandedSpreeError`    | Extends `BasicSpreeError` with a `errors` field. `errors` contains a detailed explanation of the issue, ex. all the validation errors when trying to add shipping details to a Spree order. The `getErrors` method can be used to retrieve a concrete value inside `errors`, ex. `expSpreeError.getErrors(['bill_address', 'firstname'])`. |

The specific type of error returned by `fail()` can be determined using [`instanceof`][3], ex. `if(response.fail() instanceof BasicSpreeError){...}`.

## Tokens

Most endpoints require a token for authentication. It can be an Order Token, Bearer Token or a Confirmation Token.

### Order token

Identifies a guest user's cart and order.

```ts
const response = await client.cart.create()

const orderToken: string = response.success().data.attributes.token
```

### Bearer token

Identifies a logged in user.

```ts
const response = await client.authentication.getToken({
  username: 'spree@example.com',
  password: 'spree123'
})

const bearerToken: string = response.success().access_token
```

### Confirmation token

Identifies a user for a single operation. For example, to reset their account's password. Confirmation Tokens are single-use and may have an expiration date.

## Endpoints

Spree Storefront API SDK contains each endpoint according to [Spree Guides](https://guides.spreecommerce.org/api/v2/storefront)

## [OAuth Authentication](https://guides.spreecommerce.org/api/v2/authentication)

### `getToken`

Creates a [Bearer token](#bearer-token) required to authorize OAuth API calls.

**Parameters schema:**

```ts
username: string
password: string
```

**Success response schema:**

```ts
access_token: string
token_type: string = 'Bearer'
expires_in: number
refresh_token: string
created_at: number
```

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const token = await client.authentication.getToken({
  username: 'spree@example.com',
  password: 'spree123'
})
```

### `refreshToken`

Method `refreshToken` refreshes a [Bearer token](#bearer-token) required to authorize OAuth API calls.

**Parameters schema:**

```ts
refresh_token: string
```

**Success response schema:**

```ts
access_token: string
token_type: string = 'Bearer'
expires_in: number
refresh_token: string
created_at: number
```

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const token = await client.authentication.refreshToken({
  refresh_token: 'aebe2886d7dbba6f769e20043e40cfa3447e23ad9d8e82c632f60ed63a2f0df1'
})
```

## [Account](https://guides.spreecommerce.org/api/v2/storefront/#tag/Account)

### `create`

Creates new account and returns its attributes.

**Parameters schema:**

```ts
user: {
  email: string
  password: string
  password_confirmation: string
}
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.account.create({
  user: {
    email: 'john@snow.org',
    password: 'spree123',
    password_confirmation: 'spree123'
  }
})
```

### `confirm`

Confirms new account e-mail and returns account registration status.

**Parameters schema:**

```ts
confirmationToken: string
```

**Success response schema:**

```ts
data: {
  state: string
}
```

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.account.confirm('2xssfC9Hzf8DJXyRZGmB')
```

### `forgotPassword`

Sends an account recovery link to the provided email address. The link allows resetting the password for the account.

**Parameters schema:**

```ts
user: {
  email: string
}
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.account.forgotPassword({
  user: {
    email: 'spree@example.com'
  }
})
```

### `resetPassword`

Changes the password associated with the account using an account recovery token.

**Parameters schema:**

```ts
user: {
  password: string
  password_confirmation: string
}
```

**Required token:** [Confirmation token](#confirmation-token)

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.account.resetPassword('7381273269536713689562374856', {
  user: {
    password: '123!@#asdASD',
    password_confirmation: '123!@#asdASD'
  }
})
```

### `update`

Updates account and returns its attributes.

**Parameters schema:**

```ts
user: {
  email: string
  password: string
  password_confirmation: string
}
```

**Required token:** [Bearer token](#bearer-token)

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.account.update(
  { bearerToken },
  {
    user: {
      email: 'john@snow.org',
      password: 'new_spree123',
      password_confirmation: 'new_spree123'
    }
  }
)
```

### `accountInfo`

Returns current user information.

**Required token:** [Bearer token](#bearer-token)

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.account.accountInfo({ bearerToken })
```

### `creditCardsList`

Returns a list of Credit Cards for the signed in User.

**Required token:** [Bearer token](#bearer-token)

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.account.creditCardsList({ bearerToken })
```

### `defaultCreditCard`

Return the User's default Credit Card.

**Required token:** [Bearer token](#bearer-token)

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.account.defaultCreditCard({ bearerToken })
```

### `completedOrdersList`

Returns Orders placed by the User. Only completed ones.

**Required token:** [Bearer token](#bearer-token)

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.account.completedOrdersList({ bearerToken })
```

### `completedOrder`

Return the User's completed Order.

**Required token:** [Bearer token](#bearer-token)

**Parameters schema:**

```ts
orderNumber: string
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.account.completedOrder({ bearerToken }, 'R653163382')
```

### `addressesList`

Returns a list of Addresses for the signed in User

**Required token:** [Bearer token](#bearer-token)

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.account.addressesList({ bearerToken })
```

### `showAddress`

Create a new Address for the signed in User.

**Required token:** [Bearer token](#bearer-token)

**Parameters schema:**

```ts
addressId: string
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.account.showAddress({ bearerToken }, '1')
```

### `createAddress`

Create a new Address for the signed in User.

**Required token:** [Bearer token](#bearer-token)

**Parameters schema:**

```ts
address: {
  firstname: string
  lastname: string
  address1: string
  address2?: string
  city: string
  phone?: string
  zipcode: string
  state_name: string // State Abbreviations
  country_iso: string // Country ISO (2-chars) or ISO3 (3-chars)
  company?: string
}
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.account.createAddress(
  { bearerToken },
  {
    address: {
      firstname: 'John',
      lastname: 'Snow',
      address1: '7735 Old Georgetown Road',
      address2: '2nd Floor',
      city: 'Bethesda',
      phone: '3014445002',
      zipcode: '20814',
      state_name: 'MD',
      country_iso: 'US',
      company: 'Spark'
    }
  }
)
```

### `updateAddress`

Update selected Address for the signed in User.

**Required token:** [Bearer token](#bearer-token)

**Parameters schema:**

```ts
address: {
  firstname: string
  lastname: string
  address1: string
  address2?: string
  city: string
  phone?: string
  zipcode: string
  state_name: string // State Abbreviations
  country_iso: string // Country ISO (2-chars) or ISO3 (3-chars)
  company?: string
}
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.account.updateAddress({ bearerToken }, '1', {
  address: {
    firstname: 'John',
    lastname: 'Snow',
    address1: '7735 Old Georgetown Road',
    address2: '2nd Floor',
    city: 'Bethesda',
    phone: '3014445002',
    zipcode: '20814',
    state_name: 'MD',
    country_iso: 'US',
    company: 'Spark'
  }
})
```

### `removeAddress`

Removes selected Address for the signed in User.

**Required token:** [Bearer token](#bearer-token)

**Parameters schema:**

```ts
addressId: string
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.account.removeAddress({ bearerToken }, '1')
```

## [Order](https://guides.spreecommerce.org/api/v2/storefront/#tag/Order-Status)

### `status`

Returns placed Order.

**Required token:** [Order token](#order-token)

**Parameters schema:**

```ts
orderNumber: string
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.order.status({ orderToken }, 'R653163382')
```

## [Cart](https://guides.spreecommerce.org/api/v2/storefront/#tag/Cart)

### `create`

Creates new Cart and returns it attributes.

**Required token:** [Bearer token](#bearer-token) if logged in user

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Logged in user
const response = await client.cart.create({ bearerToken })

// or guest user
const response = await client.cart.create()
```

### `show`

Returns contents of the cart.

**Required token:** [Bearer token](#bearer-token) or [Order token](#order-token)

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Logged in user
const response = await client.cart.show({ bearerToken })

// or guest user
const response = await client.cart.show({ orderToken })
```

### `addItem`

Adds a Product Variant to the Cart.

**Required token:** [Bearer token](#bearer-token) or [Order token](#order-token)

**Parameters schema:**

```ts
{
  variant_id: string
  quantity: number
  options?: {
    [key: string]: string
  }
}
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Logged in user
const response = await client.cart.addItem(
  { bearerToken },
  {
    variant_id: '1',
    quantity: 1
  }
)

// or guest user
const response = await client.cart.addItem(
  { orderToken },
  {
    variant_id: '1',
    quantity: 1
  }
)
```

### `setQuantity`

Sets the quantity of a given line item. It has to be a positive integer greater than 0.

**Required token:** [Bearer token](#bearer-token) or [Order token](#order-token)

**Parameters schema:**

```ts
{
  line_item_id: string
  quantity: number
}
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Logged in user
const response = await client.cart.setQuantity(
  { bearerToken },
  {
    line_item_id: '9',
    quantity: 100
  }
)

// or guest user
const response = await client.cart.setQuantity(
  { orderToken },
  {
    line_item_id: '9',
    quantity: 100
  }
)
```

### `removeItem`

Removes Line Item from Cart.

**Required token:** [Bearer token](#bearer-token) or [Order token](#order-token)

**Parameters schema:**

```ts
line_item_id: string
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Logged in user
const response = await client.cart.removeItem({ bearerToken }, '1')

// or guest user
const response = await client.cart.removeItem({ orderToken }, '1')
```

### `emptyCart`

Empties the Cart.

**Required token:** [Bearer token](#bearer-token) or [Order token](#order-token)

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Logged in user
const response = await client.cart.emptyCart({ bearerToken })

// or guest user
const response = await client.cart.emptyCart({ orderToken })
```

### `applyCouponCode`

Applies a coupon code to the Cart.

**Required token:** [Bearer token](#bearer-token) or [Order token](#order-token)

**Parameters schema:**

```ts
{
  coupon_code: string
}
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Loged in user
const response = await client.cart.applyCouponCode(
  { bearerToken },
  {
    coupon_code: 'promo_test'
  }
)

// or guest user
const response = await client.cart.applyCouponCode(
  { orderToken },
  {
    coupon_code: 'promo_test'
  }
)
```

### `removeCouponCode`

Removes a coupon code from the Cart.

**Required token:** [Bearer token](#bearer-token) or [Order token](#order-token)

**Optional parameters schema:**

```ts
coupon_code?: string
```

**Success response schema:** [Success schema](#success-schema)

**Filed response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Logged in user
const response = await client.cart.removeCouponCode({ bearerToken }, 'promo_test')

// or guest user
const response = await client.cart.removeCouponCode({ orderToken }, 'promo_test')
```

### `estimateShippingMethods`

Returns a list of Estimated Shipping Rates for Cart.

**Required token:** [Bearer token](#bearer-token) or [Order token](#order-token)

**Parameters schema:**

```ts
country_iso: string
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Logged in user
const response = await client.cart.estimateShippingMethods({ bearerToken }, 'USA')

// or guest user
const response = await client.cart.estimateShippingMethods({ orderToken }, 'USA')
```

## [Checkout](https://guides.spreecommerce.org/api/v2/storefront/#tag/Checkout)

### `orderUpdate`

Updates the Checkout
You can run multiple Checkout updates with different data types.

**Required token:** [Bearer token](#bearer-token) or [Order token](#order-token)

**Parameters schema:**

```ts
order: {
  email: string
  bill_address_attributes?: {
    firstname: string
    lastname: string
    address1: string
    city: string
    phone: string
    zipcode: string
    state_name: string
    country_iso: string
  }
  ship_address_attributes?: {
    firstname: string
    lastname: string
    address1: string
    city: string
    phone: string
    zipcode: string
    state_name: string
    country_iso: string
  }
  shipments_attributes?: [
    {
      selected_shipping_rate_id: number
      id: number
    }
  ]
  payments_attributes?: [
    {
      payment_method_id: number
    }
  ]
}
payment_source?: {
  [payment_method_id: number]: {
    number: string
    month: string
    year: string
    verification_value: string
    name: string
  }
}
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Logged in user
const response = await client.checkout.orderUpdate({ bearerToken }, { order: {...} })

// or guest user
const response = await client.checkout.orderUpdate({ orderToken }, { order: {...} })
```

### `orderNext`

Goes to the next Checkout step.

**Required token:** [Bearer token](#bearer-token) or [Order token](#order-token)

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Logged in user
const response = await client.checkout.orderNext({ bearerToken })

// or guest user
const response = await client.checkout.orderNext({ orderToken })
```

### `advance`

Advances Checkout to the furthest Checkout step validation allows, until the Complete step.

**Required token:** [Bearer token](#bearer-token) or [Order token](#order-token)

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Logged in user
const response = await client.checkout.advance({ bearerToken })

// or guest user
const response = await client.checkout.advance({ orderToken })
```

### `complete`

Completes the Checkout.

**Required token:** [Bearer token](#bearer-token) or [Order token](#order-token)

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Logged in user
const response = await client.checkout.complete({ bearerToken })

// or guest user
const response = await client.checkout.complete({ orderToken })
```

### `addStoreCredits`

Adds Store Credit payments if a user has any.

**Required token:** [Bearer token](#bearer-token) or [Order token](#order-token)

**Parameters schema:**

```ts
{
  amount: number
}
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Logged in user
const response = await client.checkout.addStoreCredits({ bearerToken }, { amount: 100 })

// or guest user
const response = await client.checkout.addStoreCredits({ orderToken }, { amount: 100 })
```

### `removeStoreCredits`

Remove Store Credit payments if any applied.

**Required token:** [Bearer token](#bearer-token) or [Order token](#order-token)

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Logged in user
const response = await client.checkout.removeStoreCredits({ bearerToken })

// or guest user
const response = await client.checkout.removeStoreCredits({ orderToken })
```

### `paymentMethods`

Returns a list of available Payment Methods.

**Required token:** [Bearer token](#bearer-token) or [Order token](#order-token)

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Logged in user
const response = await client.checkout.paymentMethods({ bearerToken })

// or guest user
const response = await client.checkout.paymentMethods({ orderToken })
```

### `shippingMethods`

Returns a list of available Shipping Rates for Checkout. Shipping Rates are grouped against Shipments. Each checkout cna have multiple Shipments eg. some products are available in stock and will be send out instantly and some needs to be backordered.

**Required token:** [Bearer token](#bearer-token) or [Order token](#order-token)

**Optional parameters schema:**

```ts
{
  params?: {
    include?: string
  }
}
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
// Logged in user
const response = await client.checkout.shippingMethods(
  { bearerToken },
  {
    include: 'shipping_rates,stock_location'
  }
)

// or guest user
const response = await client.checkout.shippingMethods(
  { orderToken },
  {
    include: 'shipping_rates,stock_location'
  }
)
```

## [Products](https://guides.spreecommerce.org/api/v2/storefront/#tag/Products)

Returns a list of Products.

### `list`

**Optional parameters schema:**

```ts
{
  include?: string
  fields?: {
    [key: string]: string
  }
  filter?: {
    [key: string]: number
  }
  sort?: string
  page?: number
  per_page?: number
}
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.products.list()
```

### `show`

**Optional parameters schema:**

```ts
{
  id: string
  params?: {
    include: string
    fields: {
      [key: string]: string
    }
  }
}
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = = await client.products.show('123')
```

## [Taxons](https://guides.spreecommerce.org/api/v2/storefront/#tag/Taxons)

### `list`

Returns a list of Taxons.

**Optional parameters schema:**

```ts
{
  include?: string
  fields?: {
    [key: string]: string
  }
  filter?: {
    [key: string]: number
  }
  page?: number
  per_page?: number
}
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const response = await client.taxons.list()
```

### `show`

Returns a single Taxon.

**Optional parameters schema:**

```ts
{
  id: string
  params?: {
    include: string
    fields: {
      [key: string]: string
    }
  }
}
```

**Success response schema:** [Success schema](#success-schema)

**Failure response schema:** [Error schema](#error-schema)

**Example:**

```ts
const products = await client.taxons.show('1')
```

## Checkout Flow

### One step

```ts
const cartCreateResponse = await client.cart.create()

const orderToken = cartCreateResponse.success().data.attributes.token

await client.cart.addItem({ orderToken }, { variant_id: '1' })

// Save a shipping address for shipping methods
await client.checkout.orderUpdate({ orderToken }, {
  order: {
    ship_address_attributes: {...}
  }
})

const shipping = (await client.checkout.shippingMethods({ orderToken })).success()

const payment = (await client.checkout.paymentMethods({ orderToken })).success()

// Pick a shipping and payment method

await client.checkout.orderUpdate({ orderToken }, { order: {...} })

await client.checkout.complete({ orderToken })
```

### Three steps

```ts
const cartCreateResponse = await client.cart.create()

const orderToken = cartCreateResponse.success().data.attributes.token

await client.cart.addItem({ orderToken }, { variant_id: '1' })

// Step one - save email, billing and shipping addresses
await client.checkout.orderUpdate({ orderToken }, {
  order: {
    email,
    bill_address_attributes: {...},
    ship_address_attributes: {...}
  }
})

await client.checkout.orderNext({ bearerToken })

// Step two - pick a shipping method
const shipping = (await client.checkout.shippingMethods({ orderToken })).success()

await client.checkout.orderUpdate({ orderToken }, {
  order: {
    shipments_attributes: [{
      id: shipping.data[0].id,
      selected_shipping_rate_id: shipping.data[0].relationships.shipping_rates.data[0].id
    }]
  }
})

await client.checkout.orderNext({ orderToken })

// Step three - pick a payment method
const payment = (await client.checkout.paymentMethods({ orderToken })).success()

await client.checkout.orderUpdate({ orderToken }, {
  order: {
    payments_attributes: [{
      payment_method_id: payment.data[0].id
    }]
  },
  payment_source: {
    [payment.data[0].id]: {
      number: '4111111111111111',
      month: '1',
      year: '2022',
      verification_value: '123',
      name: 'John Doe'
    }
  }
})

// Order complete
await client.checkout.orderNext({ orderToken })

await client.checkout.complete({ orderToken })
```

## About Spark Solutions

[![Spark Solutions](http://sparksolutions.co/wp-content/uploads/2015/01/logo-ss-tr-221x100.png)][spark]

Spree is maintained by [Spark Solutions Sp. z o.o.][spark].

We are passionate about open source software.
We are [available for hire][spark].

[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[3]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof
[4]: https://jsonapi.org/format/
[5]: https://unpkg.com/@spree/storefront-api-v2-sdk@4.5.1/dist/client/index.js
[6]: https://unpkg.com/@spree/storefront-api-v2-sdk/dist/client/index.js
[7]: https://unpkg.com/
[spark]: http://sparksolutions.co?utm_source=github
