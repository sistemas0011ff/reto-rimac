import { ICommand } from "./ICommand";
import { ICommandResult } from "./ICommandResult";

export interface ICommandHandler<TCommand extends ICommand, TResult extends ICommandResult> {
    handle(command: TCommand): Promise<TResult>;
}