// 输入经过鉴权的telegram bot发来的JSON实例，输出记账文本（字符串）

interface rawLanguageIn {
    text: String;
    recvTime: number;

    receive(): Promise<String>;
}