import type { StrategyVerifyCallback } from 'remix-auth'
import type {
  OAuth2Profile,
  OAuth2StrategyVerifyParams,
} from 'remix-auth-oauth2'
import { OAuth2Strategy } from 'remix-auth-oauth2'

export type VKStrategyOptions = {
  clientID: string
  clientSecret: string
  callbackURL: string
  /**
   * @default "email"
   * @example "friends,video,photos"
   */
  scope?: string
  /**
   * List of available user fields here https://dev.vk.com/method/users.get.
   * */
  extraUserFields?: string[]
  display?: 'page' | 'popup' | 'mobile'
}

export type VKProfile = {
  id: string
  displayName: string
  name: {
    familyName: string
    givenName: string
  }
  emails: { value: string }[]
  photos: { value: string }[]
  _json: {
    response: ({
      id: number
      photo_max_orig: string
      has_photo: 0 | 1
      screen_name: string
      first_name: string
      last_name: string
      can_access_closed: boolean
      is_closed: boolean
    } & Record<string, never>)[]
  }
} & OAuth2Profile

export type VKExtraParams = {
  access_token: string
  email: string
  expires_in: number
  user_id: number
} & Record<string, string | number>

export class VKStrategy<User> extends OAuth2Strategy<
  User,
  VKProfile,
  VKExtraParams
> {
  public name = 'vk'

  private readonly scope: string

  private readonly display: string

  private readonly userInfoURL = 'https://api.vk.com/method/users.get'

  private readonly userFields = ['about', 'has_photo', 'photo_max_orig', 'screen_name']

  private readonly extraUserFields: VKStrategyOptions['extraUserFields'] = []

  constructor(
    { clientID, clientSecret, callbackURL, scope = '', display, extraUserFields }: VKStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<VKProfile, VKExtraParams>
    >
  ) {
    super(
      {
        clientID,
        clientSecret,
        callbackURL,
        authorizationURL: 'https://oauth.vk.com/authorize',
        tokenURL: 'https://oauth.vk.com/access_token',
      },
      verify
    )
    this.scope = scope ?? 'email'
    this.display = display ?? 'page'
    this.extraUserFields = extraUserFields ?? []
  }

  protected authorizationParams(): URLSearchParams {
    return new URLSearchParams({
      scope: this.scope,
      display: this.display,
    })
  }

  protected async userProfile(
    accessToken: string,
    extraParams: VKExtraParams
  ): Promise<VKProfile> {
    const url = new URL(this.userInfoURL)

    url.searchParams.append('access_token', accessToken)
    url.searchParams.append('v', '5.131')
    url.searchParams.append(
      'fields',
      [...this.userFields, ...(this.extraUserFields ?? [])].join(',')
    )
    url.searchParams.append('user_ids', String(extraParams.user_id))

    const response = await fetch(url.toString())

    if (!response.ok) {
      return {
        provider: 'vk',
        id: String(extraParams.user_id),
        displayName: '',
        name: {
          familyName: '',
          givenName: '',
        },
        emails: [{ value: extraParams.email }],
        photos: [],
        _json: {
          response: [],
        },
      }
    }
    const json: VKProfile['_json'] = await response.json()
    const [raw] = json.response;

    return {
      provider: 'vk',
      id: String(raw.id),
      displayName: raw.screen_name,
      name: {
        familyName: raw.last_name,
        givenName: raw.first_name,
      },
      emails: [{ value: extraParams.email }],
      photos: [{ value: raw.photo_max_orig }],
      _json: json,
    }
  }
}
