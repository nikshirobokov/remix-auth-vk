# VKStrategy

<!-- Description -->

The VK strategy is used to authenticate users against a VK account. It extends the OAuth2Strategy.

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

<!-- If it doesn't support one runtime, explain here why -->

## Usage

### Create VK application

Follow the steps on [the VK documentation](https://vk.com/dev/first_guide?f=2.%20Application%20registration) to create a new application and get a client ID and secret.

### Create the strategy instance

```ts
import { VKStrategy } from "remix-auth-vk";

let vkStrategy = new VKStrategy(
  {
    clientID: "YOUR_CLIENT_ID",
    clientSecret: "YOUR_CLIENT_SECRET",
    callbackURL: "https://example.com/auth/vk/callback"
  },
  async ({ accessToken, refreshToken, extraParams, profile }) => {
    // Get the user data from your DB or API using the tokens and profile
    return User.findOrCreate({ email: profile.emails[0].value });
  }
);

authenticator.use(vkStrategy);
```

### Setup your routes

```tsx
// app/routes/login.tsx
export default function Login() {
  return (
    <Form action="/auth/vk" method="post">
      <button>Login with VK</button>
    </Form>
  )
}
```

```tsx
// app/routes/auth/vk.tsx
import { ActionFunction, LoaderFunction } from 'remix'
import { authenticator } from '~/auth.server'

export let loader: LoaderFunction = () => redirect('/login')

export let action: ActionFunction = ({ request }) => {
  return authenticator.authenticate('vk', request)
}
```

```tsx
// app/routes/auth/vk/callback.tsx
import { ActionFunction, LoaderFunction } from 'remix'
import { authenticator } from '~/auth.server'

export let loader: LoaderFunction = ({ request }) => {
  return authenticator.authenticate('vk', request, {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
  })
}
```
