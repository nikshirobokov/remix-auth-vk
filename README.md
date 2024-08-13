# VKStrategy

<!-- Description -->

Пользователи смогут использовать свой аккаунт VK для входа на ваш Remix сайт. Данная стратегия `remix-auth-vk` является надстройкой над Remix библиотекой `OAuth2Strategy`.

## Среда разработки

| Среда      | Поддерживается |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

<!-- If it doesn't support one runtime, explain here why -->

## Установка

```console
npm i remix-auth-vk
```

```console
yarn add remix-auth-vk
```

## Использование

### Создайте приложение VK

Следуйте шагам в инструкции [Документация VK](https://vk.com/dev/first_guide?f=2.%20Application%20registration), чтобы создать новое приложение VK и получить свой client ID и защищенный ключ.

### Создайте стратегию

```ts
import { VKStrategy } from 'remix-auth-vk'

const vkStrategy = new VKStrategy(
  {
    clientID: 'ВАШ_CLIENT_ID',
    clientSecret: 'ВАШ_ЗАЩИЩЕННЫЙ_КЛЮЧ',
    callbackURL: 'https://example.com/auth/vk/callback',
  },
  async ({ accessToken, extraParams, profile }) => {
    // Псевдо-код по обработке данных пользователя и т.п.
    return User.findOrCreate({ email: profile.emails[0].value })
  }
)

authenticator.use(vkStrategy)
```

### Настройте маршрутизацию сайта

```tsx
// app/routes/login.tsx
export default function Login() {
  // Страница авторизации
  return (
    <Form action="/auth/vk" method="post">
      <button>Войти с VK</button>
    </Form>
  )
}
```

```tsx
// app/routes/auth/vk.tsx
import { ActionFunction, LoaderFunction } from 'remix'
import { authenticator } from '~/auth.server'

export const loader: LoaderFunction = () => redirect('/login')

export const action: ActionFunction = ({ request }) => {
  return authenticator.authenticate('vk', request)
}
```

```tsx
// app/routes/auth/vk/callback.tsx
import { ActionFunction, LoaderFunction } from 'remix'
import { authenticator } from '~/auth.server'

export const loader: LoaderFunction = ({ request }) => {
  return authenticator.authenticate('vk', request, {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
  })
}
```
