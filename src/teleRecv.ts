// 输入经过鉴权的telegram bot发来的JSON实例，输出记账文本（字符串）

// 用于接受http传来的自然语言记账文本
interface rawLanguageIn {
    text: String;
    recvTime: number;

    //监听方法
    receive(): Promise<String>;
}