import { Router } from 'itty-router'
import { v4 as uuidv4 } from 'uuid'
const router = Router()

addEventListener('fetch', e => {
  e.respondWith(router.handle(e.request))
})

router.GET("/", () => {
  return new Response(homePage(), {
    headers: { 'Content-Type': 'text/html' },
  });
})

// 储存信息
router.POST("/message", async request => {
  // 获取表单并进行储存
  const body = await request.json()
  console.log(body)
  let id = uuidv4()
  if (body.message) {
    body.visit = 0
    await setKV(id, JSON.stringify(body))
    // 成功的话，返回id，由前端拼接获得分享链接
    return new Response(id, { status: 200 });
  } else {
    return new Response("failed to create message", { status: 400 })
  }
})

// 根据id获取kv中储存的信息
router.GET("/message/:id", async ({ params }) => {
  let id = decodeURIComponent(params.id)
  let msg = await getKV(id)
  let data = JSON.parse(msg)
  if (data == null) {
    console.log("cannot find kv")
    return new Response(displayPage(JSON.stringify({ message: "Cannot find message..." })), { headers: { 'Content-Type': 'text/html' }, status: 200 })
  }

  // 对于过期/访问次数的判断
  if (data.maxvists != 0) {
    data.visit = data.visit + 1
    if (data.visit == data.maxvists) {
      // 删除KV
      console.log("delete kv: " + id)
      await delKV(id)
    } else if (data.visit > data.maxvists) {
      // 清空
      data.message = ""
      data.encrypt = false
    } else {
      // 更新KV
      await setKV(id, JSON.stringify(data))
    }
  }

  data.visit = 0
  data.maxvists = 0
  return new Response(displayPage(JSON.stringify(data)), { headers: { 'Content-Type': 'text/html' }, status: 200 })
})

router.all("*", () => new Response("404, not found!", { status: 404 }))
const setKV = async (id, message) => PIGEON.put(id, message)
const getKV = async (id) => PIGEON.get(id)
const delKV = async (id) => PIGEON.delete(id)


const homePage = () => `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no" />
    <meta name="renderer" content="webkit" />
    <meta name="force-rendering" content="webkit" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mdui@1.0.2/dist/css/mdui.min.css" />
    <title>Digital Pigeon</title>
</head>

<style>
    html,
    body {
        height: 100%;
        width: 100%;
        box-sizing: border-box;
    }

    .card-container {
        padding-top: 4rem;
        height: 80%;
    }


    .card-container-row {
        height: 85%;
    }

    .input-panel {
        height: 100%;
    }

    .generate-link-btn {
        margin-top: 1rem;
        margin-bottom: 1.5rem;
        width: 100%;
    }

    .form-panel {
        padding-top: 1rem;
        height: 85%;
    }

    .message-container {
        height: 100%;
    }

    .message-area {
        padding: 1rem;
        height: 90%;
        width: 90%;
        resize: none;
    }

    /* 小屏幕 */
    @media (max-width: 599px) {
        .card-container {
            padding-top: 1rem;
            height: 80%;
        }
    }
</style>

<body class="mdui-theme-layout-auto">
    <header class="mdui-appbar">
        <div class="mdui-toolbar mdui-color-theme">
            <a href="javascript:;" class="mdui-typo-headline mdui-ripple">Digital Pigeon</a>
            <a href="javascript:;" class="mdui-typo-title mdui-ripple">咕咕送信</a>
            <div class="mdui-toolbar-spacer"></div>
            <a href="https://github.com/aoyouer/digitalpigeon" target="_blank">
                <ion-icon name="logo-github" class="mdui-icon"></ion-icon>
            </a>
        </div>
    </header>

    <div class="card-container mdui-container-fluid">
        <div class="mdui-row card-container-row">
            <!-- 输入卡片 -->
            <div class="mdui-col-xs-10 mdui-col-offset-xs-1 mdui-col-md-8 mdui-col-offset-md-2 input-panel">
                <form class="mdui-row form-panel">
                    <!-- 信息输入 -->
                    <div class="message-container mdui-col-xs-12 mdui-col-md-8">
                        <textarea name="message" class="message-area manual-color"
                            placeholder="Input your message~"></textarea>
                    </div>
                    <!-- 信息选项 -->
                    <div class="message-options mdui-col-xs-12 mdui-col-md-4">
                        <div class="mdui-textfield">
                            <label class="mdui-textfield-label">Maximum visits</label>
                            <input class="mdui-textfield-input" name="maxium-vists" type="text" value=0
                                pattern="(^[1-9][1-9]*$)|(^0$)" required />
                            <div class="mdui-textfield-error">input must be a number</div>
                            <div class="mdui-textfield-helper">zero for unlimited access</div>
                        </div>
                        <div class="mdui-textfield">
                            <label class="mdui-textfield-label">password (Leave blank for no encryption)</label>
                            <input class="mdui-textfield-input" name="aes-key" type="text" value="" />
                        </div>
                    </div>
                </form>
                <div><button id="generate" class="mdui-btn mdui-btn-raised generate-link-btn mdui-ripple">Generate
                        link</button>
                </div>
            </div>

            <!-- 生成消息后对话框 -->
            <div class="mdui-dialog" id="generation-ok-dialog">
                <div class="mdui-dialog-title">success! copy the share link.</div>
                <div class="mdui-dialog-content sharelink-content"></div>
                <div class="mdui-dialog-actions">
                    <button class="mdui-btn mdui-ripple" mdui-dialog-cancel>ok</button>
                    <button class="mdui-btn mdui-ripple" mdui-dialog-confirm>copy</button>
                </div>
            </div>
        </div>
    </div>

    <footer></footer>
    <script type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script>
    <script nomodule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mdui@1.0.2/dist/js/mdui.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/crypto-js@4.1.1/crypto-js.js"></script>
    <script>
        // 部分组件无法自动跟随主题设置深色模式，需要手动设置
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            let eles = document.getElementsByClassName("manual-color")
            Array.prototype.forEach.call(eles, function (ele) {
                ele.classList.add("mdui-color-grey-600")
            })
        }
        let listeners = {
            dark: (mediaQueryList) => {
                if (mediaQueryList.matches) {
                    let eles = document.getElementsByClassName("manual-color")
                    Array.prototype.forEach.call(eles, function (ele) {
                        ele.classList.add("mdui-color-grey-600")
                    })
                }
            },
            light: (mediaQueryList) => {
                if (mediaQueryList.matches) {
                    let eles = document.getElementsByClassName("manual-color")
                    Array.prototype.forEach.call(eles, function (ele) {
                        ele.classList.remove("mdui-color-grey-600")
                    })
                }
            }
        }
        window.matchMedia('(prefers-color-scheme: dark)').addListener(listeners.dark)
        window.matchMedia('(prefers-color-scheme: light)').addListener(listeners.light)

        const generateMessage = async () => {
            let input = document.querySelector("textarea[name=message]").value
            let mv = parseInt(document.querySelector("input[name=maxium-vists]").value)
            let aeskey = document.querySelector("input[name=aes-key]").value
            let e = false
            let msg = input
            // TODO 支持aes加密信息 前端进行
            if (aeskey) {
                msg = CryptoJS.AES.encrypt(input, escape(aeskey)).toString()
                e = true
            }

            if (input.length) {
                // TODO 支持设置最大访问次数
                // TODO 支持设置过期时间
                let d = JSON.stringify({
                    message: msg,
                    maxvists: mv,
                    encrypt: e
                })
                const response = await fetch("/message", {
                    method: "POST",
                    body: d,
                })
                if (response.status == 200) {
                    let data = await response.text()
                    let $ = mdui.$;
                    // 对应两个按钮的点击事件
                    $("#generation-ok-dialog").on('cancel.mdui.dialog', () => {
                        clearInputs()
                    })
                    $("#generation-ok-dialog").on('confirm.mdui.dialog', () => {
                        let shareLink = document.getElementsByClassName("sharelink-content")[0].innerText
                        navigator.clipboard.writeText(shareLink);
                        clearInputs()
                    })
                    let dialog = new mdui.Dialog('#generation-ok-dialog');
                    const dialogElement = document.getElementsByClassName("sharelink-content")[0]
                    let url = window.location.href
                    let shareLink = url.substring(0, url.lastIndexOf("/")) + "/message/" + data
                    dialogElement.innerText = shareLink
                    dialog.open()
                }
            } else {
                // TODO 信息为空时的提示
            }
        }
        document.querySelector("#generate").addEventListener("click", generateMessage)

        const clearInputs = () => {
            let input = document.querySelector("textarea[name=message]")
            let m = document.querySelector("input[name=maxium-vists]")
            let aeskey = document.querySelector("input[name=aes-key]")
            input.value = ""
            m.value = 0
            aeskey.value = ""
        }

    </script>
</body>

</html>
`

// 信息展示页
const displayPage = (data) => `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no" />
    <meta name="renderer" content="webkit" />
    <meta name="force-rendering" content="webkit" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mdui@1.0.2/dist/css/mdui.min.css" />
    <title>Digital Pigeon</title>
</head>

<style>
    html,
    body {
        height: 100%;
        width: 100%;
        box-sizing: border-box;
    }

    .card-container {
        padding-top: 4rem;
        height: 80%;
    }

    .card-container-row {
        height: 85%;
    }

    .generate-link-btn {
        width: 100%;
    }

    .message-panel {
        padding-top: 1rem;
        height: 85%;
    }

    .message-container {
        height: 100%;
    }

    .message-area {
        padding: 1rem;
        height: 90%;
        width: 90%;
        resize: none;
    }

    /* 小屏幕 */
    @media (max-width: 599px) {}
</style>

<body class="mdui-theme-layout-auto">
    <header class="mdui-appbar">
        <div class="mdui-toolbar mdui-color-theme">
            <a href="/" class="mdui-typo-headline mdui-ripple">Digital Pigeon</a>
            <a href="/" class="mdui-typo-title mdui-ripple">咕咕送信</a>
            <div class="mdui-toolbar-spacer"></div>
            <a href="https://github.com/aoyouer/digitalpigeon" target="_blank">
                <ion-icon name="logo-github" class="mdui-icon"></ion-icon>
            </a>
        </div>
    </header>

    <div class="card-container mdui-container-fluid">
        <div class="mdui-row card-container-row">
            <!-- 展示卡片 -->
            <!-- <div class="mdui-col-xs-12 mdui-col-sm-8 mdui-col-offset-sm-2 message-panel"> -->
            <div class="message-container mdui-col-xs-10 mdui-col-offset-xs-1 mdui-col-md-8 mdui-col-offset-md-2">
                <textarea name="message" class="message-area manual-color" placeholder="Message..."></textarea>
            </div>
            <!-- </div> -->

            <!-- 询问aes密钥 -->
            <div class="mdui-dialog" id="generation-ok-dialog">
                <div class="mdui-dialog-title">success! copy the share link.</div>
                <div class="mdui-dialog-content sharelink-content"></div>
                <div class="mdui-dialog-actions">
                    <button class="mdui-btn mdui-ripple" mdui-dialog-cancel>ok</button>
                    <button class="mdui-btn mdui-ripple" mdui-dialog-confirm>copy</button>
                </div>
            </div>
        </div>
    </div>

    <footer></footer>
    <script type="module" src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"></script>
    <script nomodule src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mdui@1.0.2/dist/js/mdui.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/crypto-js@4.1.1/crypto-js.js"></script>
    <script>
        // 部分组件无法自动跟随主题设置深色模式，需要手动设置
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            let eles = document.getElementsByClassName("manual-color")
            Array.prototype.forEach.call(eles, function (ele) {
                ele.classList.add("mdui-color-grey-600")
            })
        }
        let listeners = {
            dark: (mediaQueryList) => {
                if (mediaQueryList.matches) {
                    let eles = document.getElementsByClassName("manual-color")
                    Array.prototype.forEach.call(eles, function (ele) {
                        ele.classList.add("mdui-color-grey-600")
                    })
                }
            },
            light: (mediaQueryList) => {
                if (mediaQueryList.matches) {
                    let eles = document.getElementsByClassName("manual-color")
                    Array.prototype.forEach.call(eles, function (ele) {
                        ele.classList.remove("mdui-color-grey-600")
                    })
                }
            }
        }
        window.matchMedia('(prefers-color-scheme: dark)').addListener(listeners.dark)
        window.matchMedia('(prefers-color-scheme: light)').addListener(listeners.light)

        const askPassword = () => {
            mdui.prompt('Key required', 'Encrypted message',
                (key) => {
                    let decrypted = CryptoJS.AES.decrypt(messageData.message, escape(key)).toString(CryptoJS.enc.Utf8);
                    messageElement.innerText = decrypted
                },
                () => {
                },
                {
                    history: false
                }
            )
        }

        const messageData = ${data}
        let messageElement = document.querySelector("textarea[name=message]")
        messageElement.innerText = messageData.message
        if (messageData.encrypt) {
            // 要求输入密钥进行解密
            askPassword()
        }
    </script>
</body>

</html>
`