export default interface IMediatorHandle<T> {
    name: string;
    ableToNavigate: boolean;
    handle(value: T) : Promise<any>;
}