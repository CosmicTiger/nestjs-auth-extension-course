export interface ActiveUserData {
  /**
   * @summary The "subject" of the token, which is usually the value user ID
   * that was granted within the token
   */
  sub: number;
  /**
   * @summary The email address of the user
   */
  email: string;
}
