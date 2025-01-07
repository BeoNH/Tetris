import { _decorator, Component, Node } from 'cc';
import Request from './Request';
const { ccclass, property } = _decorator;

@ccclass('APIManager')
export class APIManager extends Component {

    public static urlAPI: string = "https://api-tele.gamebatta.com";// batta

    public static gameID = 66;
    public static key = '53a678a6-7210-41ba-a6d2-07180beb4ef4';
    public static sessionId;

    public static requestData(key: string, data: any, callBack: (response: any) => void) {
        const url = APIManager.urlAPI + key;
        APIManager.CallPost(data, url, (response) => {
            callBack(response);
        }, (xhr) => {
            xhr.setRequestHeader('Authorization', 'Bearer ' + APIManager.urlParam(`token`));
            xhr.setRequestHeader('game_key', APIManager.key);
            xhr.setRequestHeader('x-session-id', APIManager.sessionId);
            xhr.setRequestHeader("Content-type", "application/json");
        });
    }

    public static CallPost(data, url, callback, callbackHeader) {
        let param = this;
        var xhr = new XMLHttpRequest();

        xhr.ontimeout = () => {
        }

        xhr.onabort = () => {
        }

        xhr.onloadend = () => {
        }

        xhr.onerror = () => {
            console.error('Request error.');
        };

        xhr.onreadystatechange = () => {
            if (xhr.readyState != 4) return;
            if (xhr.status == 200 && xhr.responseText) {
                var response = JSON.parse(xhr.responseText);

                console.log("CallPost=>", url, "\n", response);

                callback(response);
            }
        };
        xhr.open('POST', url, true);
        callbackHeader(xhr);
        
        const body = Request.encryptDataTS({
            ...(data || {}),
            timestamp: Date.now(),
            request_ID: Request.generateRandomID(),
        });
        
        // console.log("body: ", body);
        // console.log("decryptDataTS(body): ", Request.decryptDataTS(body));
        xhr.send(JSON.stringify(body));
    }

    public static CallLogin(callback) {
        let param = this;
        const url = APIManager.urlAPI + '/user-service/game/login';
        var xhr = new XMLHttpRequest();

        xhr.ontimeout = () => {
        }

        xhr.onabort = () => {
        }

        xhr.onloadend = () => {
        }

        xhr.onerror = () => {
            console.error('Request error.');
        };

        xhr.onreadystatechange = () => {
            if (xhr.readyState != 4) return;
            if (xhr.status == 200 && xhr.responseText) {
                var response = JSON.parse(xhr.responseText);

                console.log("CallPost=>", url, "\n", response);

                if (response.encryptedData) {
                    response = Request.decryptDataTS(response);
                    response = JSON.parse(response) || response;
                };
                APIManager.sessionId = response.data.sessionId;

                callback(response);
            }
        };
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + APIManager.urlParam(`token`));
        xhr.setRequestHeader('game_key', APIManager.key);
        xhr.setRequestHeader("Content-type", "application/json");

        const body = JSON.stringify({
            "gameId": APIManager.gameID,
        })
        xhr.send(body);
    }

    public static urlParam(name) {
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.search);
        return (results !== null) ? results[1] || 0 : false;
    }
}