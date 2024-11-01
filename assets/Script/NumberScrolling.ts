import { _decorator, Component, Label, Node, tween, Tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NumberScrolling')
export class NumberScrolling extends Component {

    @property({ tooltip: 'thoi gian chay' })
    public time: number = 0.3;
 
    @property({ tooltip: 'loai don vi' })
    public keepInteger: boolean = true;
 
    @property({ tooltip: 'doi tuong chay', type: Label })
    private label: Label = null;
 
    private _value: number = 0;
    /**
     * 数值
     */
    public get value() { return this._value; }
    public set value(value) {
        if (this.keepInteger) value = Math.floor(value);
        this._value = value;
        this.label.string = value.toString();
    }
 
    private tween: Tween<NumberScrolling> = null;
 
    private lastTarget: number = 0;
 
    protected onLoad() {
        this.init();
    }
 
    /**
     * 初始化组件
     */
    private init() {
        if (!this.label) {
            this.label = this.getComponent(Label);
        }
        this.value = 0;
    }
 
    /**
     * 设置数值
     * @param value 数值
     */
    public setValue(value: number) {
        this.value = value;
    }
 
    /**
     * 设置时间
     * @param time 时间
     */
    public setTime(time: number) {
        this.time = time;
    }
 
    /**
     * 滚动数值
     * @param target 目标值
     * @param time 时间
     * @param callback 完成回调
     */
    public to(target: number, time: number = null, callback?: () => void): Promise<void> {
        return new Promise<void>(res => {
            if (this.tween) {
                this.tween.stop();
                this.tween = null;
            }
            if (time != null) {
                this.time = time;
            }
            this.lastTarget = target;
            this.tween = tween<NumberScrolling>(this)
                .to(this.time, { value: target })
                .call(() => {
                    callback && callback();
                    this.tween = null;
                    res();
                })
                .start();
        });
    }
}