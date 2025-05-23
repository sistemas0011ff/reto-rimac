export interface ICommand {
    validate(): Promise<void> | void;
}