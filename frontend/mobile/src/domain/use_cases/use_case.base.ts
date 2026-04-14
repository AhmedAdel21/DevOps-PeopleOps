export abstract class UseCase<TInput, TOutput> {
  abstract execute(input: TInput): Promise<TOutput>;
}

export abstract class SyncUseCase<TInput, TOutput> {
  abstract execute(input: TInput): TOutput;
}
