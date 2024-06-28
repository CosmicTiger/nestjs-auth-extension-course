export interface RefreshTokenData {
  /**
   * @summary The "subject" of the token, which is usually the value user ID
   * that was granted within the token
   */
  sub: number;
  /**
   * @summary The UUID generated token for refresh cycles
   */
  refreshTokenId: string;
}
