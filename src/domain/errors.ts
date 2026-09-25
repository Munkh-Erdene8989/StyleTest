export class AppError extends Error {
  constructor(
    public code: string,
    public status: number,
    public issues?: string[],
  ) {
    super(code);
  }
}
