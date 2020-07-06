export class EventEmitter {
    private listenersMap: Map<string, Array<Function>> = new Map()
    private MaxListeners = 100
    constructor() {
    }
    on(event: string, listenr: Function) {
        if (this.listenersMap.size > this.MaxListeners) {
            console.warn('超出限制最大的listener')
        }
        const eventListensList = this.listenersMap.get(event) || [];
        if (eventListensList.indexOf(listenr) === -1) {
            eventListensList.push(listenr);
            this.listenersMap.set(event, eventListensList);
        }
    }
    emit(event: string, ...args: any[]) {
        const funcList = this.listenersMap.get(event) || [];
        funcList.forEach(f => {
            f.apply(null, args);
        });
    }
    removeListener(event: string, listener: Function) {
        const funcList = this.listenersMap.get(event) || [];
        const i = funcList.indexOf(listener);
        if (i >= 0) {
            funcList.splice(i, 1);
            this.listenersMap.set(event, funcList);
        }
    }
    once(event: string, listener: Function) {
        if (this.listenersMap.size > this.MaxListeners) {
            console.warn('超出限制最大的listener');
        }
        const fn = (...args: any[]) => {
            listener.apply(null, args);
            this.removeListener(event, fn);
        };
        this.on(event, fn);
    }

    removeAllListener(event: string) {
        this.listenersMap.delete(event);
    }
    setMaxListeners(num: number) {
        this.MaxListeners = num;
    }

    listeners(event: string) {
        return this.listenersMap.get(event);
    }
}