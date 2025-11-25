import { _decorator, Component, instantiate, Label, Node } from 'cc';
import { APIManager } from '../Script/API_batta/APIManager';
const { ccclass, property } = _decorator;

@ccclass('PopupHistory')
export class PopupHistory extends Component {

    @property({ type: Node, tooltip: "Danh sách lịch sử chơi" })
    protected layoutHistory: Node = null;

    @property({ type: Node, tooltip: "Các dòng tỏng bảng" })
    protected itemHis: Node = null;

    // Khởi tạo bảng
    initHistoryList() {
        const url = `/getHistory`;
        const data = {
            "username": APIManager.userDATA?.username,
            // "username": "beonh123",
        };
        APIManager.requestData(url, data, res => {
            if (!res) return;

            const listHis = res.history; // mảng dữ liệu lịch sử

            // Số lượng item cho phần còn lại
            const pool = this.layoutHistory.children;

            // Duyệt qua số lượng item cần hiển thị
            for (let i = 0; i < listHis.length; i++) {
                let item: Node;
                if (i < pool.length) {
                    item = pool[i];
                    item.active = true;
                } else {
                    item = instantiate(this.itemHis);
                    item.parent = this.layoutHistory;
                    item.active = true;
                }

                // Cập nhật thông tin cho item
                item.getChildByPath("txtDate").getComponent(Label).string = this.formatDate(listHis[i].date);
                // item.getChildByPath("txtTime").getComponent(Label).string = listHis[i].numTime + "s";
                item.getChildByPath("txtScore").getComponent(Label).string = listHis[i].numScore;
            }

            // Ẩn đi những item dư thừa
            for (let k = listHis.length; k < pool.length; k++) {
                pool[k].active = false;
            }
        });
    }


    // Cấu hình lại Ngày hiện thị
    private formatDate(dateString: string): string {
        const date: Date = new Date(dateString);
        const datePart: string = date.toDateString().split(' ').slice(1).join('_');
        const timePart: string = date.toTimeString().split(' ')[0];
        return `${datePart} ${timePart}`;
      }
}


