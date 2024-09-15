export default interface IMediatorHandle<T> {
    name: string;
    handle(value: T) : Promise<any>;
}