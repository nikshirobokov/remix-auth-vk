import { OAuth2Strategy } from 'remix-auth-oauth2'
import type { Strategy } from 'remix-auth/strategy'
import type {
  VKAuthDialogDisplay,
  VKExtraParams,
  VKProfile,
  VKStrategyOptions,
} from './types.js'
export * from './types.js'

export const VKStrategyName = 'vk'
export const VKScopesSeparator = ','
export const VKStrategyDefaultScopes = ['email'].join(VKScopesSeparator)

export class VKStrategy<User> extends OAuth2Strategy<User> {
  public override name = VKStrategyName

  private readonly apiVersion: string

  private readonly display: VKAuthDialogDisplay

  private readonly userFields: string[]

  public static userInfoURL = 'https://api.vk.com/method/users.get'

  constructor(
    {
      clientID,
      clientSecret,
      callbackURL,
      apiVersion,
      display,
      scopes,
      userFields,
    }: VKStrategyOptions,
    verify: Strategy.VerifyFunction<User, OAuth2Strategy.VerifyOptions>,
  ) {
    super(
      {
        clientId: clientID,
        clientSecret,
        redirectURI: callbackURL,
        authorizationEndpoint: 'https://oauth.vk.com/authorize',
        tokenEndpoint: 'https://oauth.vk.com/access_token',
        scopes: VKStrategy.parseScopes(scopes),
      },
      verify,
    )
    this.display = display ?? 'page'
    this.userFields = userFields ?? [
      'has_photo',
      'photo_max_orig',
      'screen_name',
    ]
    this.apiVersion = apiVersion ?? '5.131'
  }

  protected override authorizationParams(
    params: URLSearchParams,
  ): URLSearchParams {
    const authParams = new URLSearchParams(params)

    authParams.set('display', this.display)

    if (this.options.scopes) {
      authParams.set('scope', this.options.scopes.join(VKScopesSeparator))
    }

    return authParams
  }

  protected async userProfile(
    accessToken: string,
    extraParams: VKExtraParams,
  ): Promise<VKProfile> {
    const url = new URL(VKStrategy.userInfoURL)

    url.searchParams.append('access_token', accessToken)
    url.searchParams.append('user_ids', String(extraParams.user_id))
    url.searchParams.append('v', this.apiVersion)
    url.searchParams.append('fields', this.userFields.join(','))

    const response = await fetch(url.toString())
    const json: VKProfile['_json'] = await response.json()
    const [user] = json.response

    if (!user) {
      throw new Error(
        'The user profile was not found in the provider response.',
      )
    }

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

  public static parseScopes(scopes: VKStrategyOptions['scopes']) {
    if (!scopes || scopes.length === 0) {
      return [VKStrategyDefaultScopes]
    }

    return scopes
  }
}
