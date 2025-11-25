import { _decorator, Component, instantiate, Label, Node } from 'cc';
import { APIManager } from '../Script/API_batta/APIManager';
const { ccclass, property } = _decorator;

@ccclass('PopupRank')
export class PopupRank extends Component {

    @property({ type: Node, tooltip: "Bộ top 3 người cao nhất" })
    protected layoutTOP3: Node = null;

    @property({ type: Node, tooltip: "Bộ các thứ tự còn lại" })
    protected layoutBXH: Node = null;

    @property({ type: Node, tooltip: "Bảng xếp hạng của người chơi" })
    protected playerRank: Node = null;

    @property({ type: Node, tooltip: "Các dòng trỏng bảng" })
    protected itemBXH: Node = null;

    // Khởi tạo bảng
    initRankingList() {
        const url = `/getRankList`;
        const data = {
            "username": APIManager.userDATA?.username,
            // "username": "beonh123",
        };
        APIManager.requestData(url, data, res => {
            if (!res) return;

            const listBXH = res.board; // mảng dữ liệu xếp hạng
            if (!listBXH) return;

            for (let i = 0; i < 3; i++) {
                const e = this.layoutTOP3.children[i];
                if (listBXH[i]) {
                    e.active = true;
                    e.getChildByPath("txtName").getComponent(Label).string = this.limitName(listBXH[i].name);
                    // e.getChildByPath("txtTime").getComponent(Label).string = listBXH[i].numTime + "s";
                    e.getChildByPath("txtScore").getComponent(Label).string = listBXH[i].numScore;
                }
            }

            // Số lượng item cho phần còn lại (BXH ngoài top3)
            const remCount = listBXH.length - 3;
            const pool = this.layoutBXH.children;

            // Duyệt qua số lượng item cần hiển thị
            for (let j = 0; j < remCount; j++) {
                let item: Node;
                if (j < pool.length) {
                    item = pool[j];
                    item.active = true;
                } else {
                    item = instantiate(this.itemBXH);
                    item.parent = this.layoutBXH;
                    item.active = true;
                }

                // Cập nhật thông tin cho item
                const rankIndex = j + 3;
                item.getChildByPath("txtRank").getComponent(Label).string = `${rankIndex + 1}`;
                item.getChildByPath("txtName").getComponent(Label).string = this.limitName(listBXH[rankIndex].name);
                // item.getChildByPath("txtTime").getComponent(Label).string = listBXH[rankIndex].numTime + "s";
                item.getChildByPath("txtScore").getComponent(Label).string = listBXH[rankIndex].numScore;
            }

            // Ẩn đi những item dư thừa
            if (remCount > 0) {
                for (let k = remCount; k < pool.length; k++) {
                    pool[k].active = false;
                }
            }

            if(!res.yourInfo) return;
            // Cập nhật thông tin xếp hạng của người chơi
            this.playerRank.getChildByPath("playerRank").getComponent(Label).string = res.yourInfo.rank;
            this.playerRank.getChildByPath("playerName").getComponent(Label).string = this.limitName(res.yourInfo.name);
            // this.playerRank.getChildByPath("playerTime").getComponent(Label).string = res.yourInfo.numTime + "s";
            this.playerRank.getChildByPath("playerScore").getComponent(Label).string = res.yourInfo.numScore;
        });
    }

    // Giới hạn text không quá dài
    private limitName(name: string): string {
        const maxLength = 15;
        if (name.length > maxLength) {
            return name.substring(0, maxLength) + ' . . .';
        }
        return name;
    }
}


