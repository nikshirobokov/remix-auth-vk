interface OAuth2Profile {
  provider: string
  name?: {
    familyName?: string
    givenName?: string
    middleName?: string
  }
}

export type VKScope = 'email' | 'friends' | 'video' | 'photos' | string
export type VKAuthDialogDisplay = 'page' | 'popup' | 'mobile'

export type VKStrategyOptions = {
  clientId: string
  clientSecret: string
  redirectURI: string
  /**
   * @default "5.131"
   */
  apiVersion?: string
  display?: VKAuthDialogDisplay
  /**
   * @default "email"
   * @example "friends,video,photos"
   */
  scopes?: VKScope[]
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
