/** Error carrying an HTTP status and a message that is safe to show to users. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly publicMessage: string,
    public readonly code?: string,
  ) {
    super(publicMessage);
    this.name = 'HttpError';
  }
}
