export interface IQueryHandler<Q, R> {
    execute(query: Q): Promise<R>;
}
