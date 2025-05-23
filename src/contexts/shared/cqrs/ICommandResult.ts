// export interface ICommandResult {}
export interface ICommandResult<T = any, C = any> {
    result: T;
    value: C;
}