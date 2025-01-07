import CryptoJS from './crypto-js.min.js';


const ENCRYPTION_KEY_STR: string = "0517d22a95433c2b894a455c9091bfc4f7fbd6c526a92312e2465888cd00edb4";

export default class Request {

    public static generateRandomID(length: number = 6): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }


    public static encryptDataTS(data: Record<string, any>): { iv: string; encryptedData: string } {
        const stringifiedData = JSON.stringify(data);
        const encryptionKey = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY_STR);
        const iv = CryptoJS.lib.WordArray.random(16);

        const encrypted = CryptoJS.AES.encrypt(
            stringifiedData,
            encryptionKey,
            {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });

        return {
            iv: iv.toString(CryptoJS.enc.Hex),
            encryptedData: encrypted.ciphertext.toString(CryptoJS.enc.Hex)
        };
    }

    public static decryptDataTS(data: { encryptedData: string; iv: string }): string {
        const decrypted = CryptoJS.AES.decrypt(
            {
                ciphertext: CryptoJS.enc.Hex.parse(data.encryptedData),
            },
            CryptoJS.enc.Hex.parse(ENCRYPTION_KEY_STR),
            {
                iv: CryptoJS.enc.Hex.parse(data.iv),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            }
        );
        return decrypted.toString(CryptoJS.enc.Utf8);
    }
}


