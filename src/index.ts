import type { StrategyVerifyCallback } from 'remix-auth'
import type {
  OAuth2Profile,
  OAuth2StrategyVerifyParams,
} from 'remix-auth-oauth2'
import { OAuth2Strategy } from 'remix-auth-oauth2'

export type VKAuthDialogDisplay = 'page' | 'popup' | 'mobile'

export type VKStrategyOptions = {
  clientID: string
  clientSecret: string
  callbackURL: string
  /**
   * @default "5.131"
   */
  apiVersion?: string
  display?: VKAuthDialogDisplay
  /**
   * @default "email"
   * @example "friends,video,photos"
   */
  scope?: string
  /**
   * List of available user fields here https://dev.vk.com/method/users.get.
   * */
  userFields?: string[]
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

  private readonly apiVersion: string

  private readonly display: VKAuthDialogDisplay

  private readonly scope: string

  private readonly userFields: string[]

  private readonly userInfoURL = 'https://api.vk.com/method/users.get'

  constructor(
    {
      clientID,
      clientSecret,
      callbackURL,
      apiVersion,
      display,
      scope,
      userFields,
    }: VKStrategyOptions,
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
    this.userFields = userFields ?? [
      'has_photo',
      'photo_max_orig',
      'screen_name',
    ]
    this.apiVersion = apiVersion ?? '5.131'
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
    url.searchParams.append('user_ids', String(extraParams.user_id))
    url.searchParams.append('v', this.apiVersion)
    url.searchParams.append('fields', this.userFields.join(','))

    const response = await fetch(url.toString())
    const contentType = response.headers.get('Content-Type')
    const json: VKProfile['_json'] =
      contentType?.includes('application/json') && (await response.json())

    if (!response.ok) {
      return {
        provider: this.name,
        id: String(extraParams.user_id),
        displayName: '',
        name: {
          familyName: '',
          givenName: '',
        },
        emails: [{ value: extraParams.email }],
        photos: [],
        _json: json ?? {
          response: [],
        },
      }
    }
    const [user] = json.response

    return {
      provider: this.name,
      id: String(user.id),
      displayName: user.screen_name,
      name: {
        familyName: user.last_name,
        givenName: user.first_name,
      },
      emails: [{ value: extraParams.email }],
      photos: [{ value: user.photo_max_orig }],
      _json: json,
    }
  }
}
