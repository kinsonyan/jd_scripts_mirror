/*
 * @Author: LXK9301 https://github.com/LXK9301
 * @Date: 2020-11-12 11:42:12 
 * @Last Modified by: LXK9301
 * @Last Modified time: 2021-1-22 14:27:20
 */
/*
东东小窝 https://gitee.com/lxk0301/jd_scripts/raw/master/jd_small_home.js
现有功能：
做日常任务任务，每日抽奖（有机会活动京豆，使用的是免费机会，不消耗WO币）
自动使用WO币购买装饰品可以获得京豆，分别可获得5,20，50,100,200,400,700，1200京豆）

注：目前使用此脚本会给脚本内置的两个码进行助力，请知晓

活动入口：京东APP我的-游戏与更多-东东小窝
或 京东APP首页-搜索 玩一玩-DIY理想家
微信小程序入口：
来客有礼 - > 首页 -> 东东小窝
网页入口（注：进入后不能再此刷新，否则会有问题，需重新输入此链接进入）
https://h5.m.jd.com/babelDiy/Zeus/2HFSytEAN99VPmMGZ6V4EYWus1x/index.html

已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js
===============Quantumultx===============
[task_local]
#东东小窝
16 22 * * * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_small_home.js, tag=东东小窝, img-url=https://raw.githubusercontent.com/58xinian/icon/master/ddxw.png, enabled=true

================Loon==============
[Script]
cron "16 22 * * *" script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_small_home.js, tag=东东小窝

===============Surge=================
东东小窝 = type=cron,cronexp="16 22 * * *",wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_small_home.js

============小火箭=========
东东小窝 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_small_home.js, cronexpr="16 22 * * *", timeout=3600, enable=true
 */
const $ = new Env('东东小窝');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';

//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message = '';
let isPurchaseShops = false;//是否一键加购商品到购物车，默认不加购
$.helpToken = [];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
$.newShareCodes = [];
const JD_API_HOST = 'https://lkyl.dianpusoft.cn/api';

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      await TotalBean();
      console.log(`\n*******开始【京东账号${$.index}】${$.nickName || $.UserName}********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
      }
      await smallHome();
    }
  }
  await updateInviteCodeCDN('https://gitee.com/lxk0301/updateTeam/raw/master/shareCodes/jd_updateSmallHomeInviteCode.json');
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.token = $.helpToken[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      if ($.newShareCodes.length > 1) {
        console.log('----', (i + 1) % $.newShareCodes.length)
        let code = $.newShareCodes[(i + 1) % $.newShareCodes.length]['code']
        console.log(`\n${$.UserName} 去给自己的下一账号 ${decodeURIComponent($.newShareCodes[(i + 1) % $.newShareCodes.length]['cookie'].match(/pt_pin=(.+?);/) && $.newShareCodes[(i + 1) % $.newShareCodes.length]['cookie'].match(/pt_pin=(.+?);/)[1])}助力，助力码为 ${code}\n`)
        await createAssistUser(code, $.createAssistUserID);
      }
      console.log(`\n去帮助作者:LXK9301\n`)
      await helpFriends();
    }
  }
})()
    .catch((e) => {
      $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
      $.done();
    })
async function smallHome() {
  await loginHome();
  await ssjjRooms();
  // await helpFriends();
  if (!$.isUnLock) return;
  await createInviteUser();
  await queryDraw();
  await lottery();
  await doAllTask();
  await queryByUserId();
  await queryFurnituresCenterList();
  await showMsg();
}
function showMsg() {
  return new Promise(resolve => {
    $.msg($.name, '', `【京东账号${$.index}】${$.nickName}\n${message}`);
    resolve()
  })
}
async function lottery() {
  if ($.freeDrawCount > 0) {
    await drawRecord($.lotteryId);
  } else {
    console.log(`免费抽奖机会今日已使用\n`)
  }
}

async function doChannelsListTask(taskId, taskType) {
  await queryChannelsList(taskId);
  for (let item of $.queryChannelsList) {
    if (item.showOrder === 1) {
      await $.wait(1000)
      await followChannel(taskId, item.id)
      await queryDoneTaskRecord(taskId, taskType);
    }
  }
}
async function helpFriends() {
  // await updateInviteCode();
  // if (!$.inviteCodes) await updateInviteCodeCDN();
  if ($.inviteCodes && $.inviteCodes['inviteCode']) {
    for (let item of $.inviteCodes.inviteCode) {
      if (!item) continue
      await createAssistUser(item, $.createAssistUserID);
    }
  }
}
async function doAllTask() {
  await queryAllTaskInfo();//获取任务详情列表$.taskList
  console.log(` 任务名称   完成进度 `)
  for (let item of $.taskList) {
    console.log(`${item.ssjjTaskInfo.name}      ${item.doneNum}/${item.ssjjTaskInfo.awardOfDayNum || (item.ssjjTaskInfo.type === 1 ? 4: 1)}`)
  }
  for (let item of $.taskList) {
    if (item.ssjjTaskInfo.type === 1) {
      //邀请好友助力自己
      $.createAssistUserID = item.ssjjTaskInfo.id;
      console.log(`createAssistUserID:${item.ssjjTaskInfo.id}`)
      console.log(`\n\n助力您的好友:${item.doneNum}人`)
    }
    if (item.ssjjTaskInfo.type === 2) {
      //每日打卡
      if (item.doneNum === (item.ssjjTaskInfo.awardOfDayNum || 1)) {
        console.log(`${item.ssjjTaskInfo.name}已完成（${item.doneNum}/${item.ssjjTaskInfo.awardOfDayNum || 1}）`)
        continue
      }
      await clock(item.ssjjTaskInfo.id, item.ssjjTaskInfo.awardWoB)
    }
    // 限时连连看
    if (item.ssjjTaskInfo.type === 3) {
      if (item.doneNum === item.ssjjTaskInfo.awardOfDayNum) {
        console.log(`${item.ssjjTaskInfo.name}已完成[${item.doneNum}/${item.ssjjTaskInfo.awardOfDayNum}]`)
        continue
      }
      for (let i = 0; i < new Array(item.ssjjTaskInfo.awardOfDayNum || 1).fill('').length; i++) {
        await game(item.ssjjTaskInfo.id, item.doneNum);
      }
    }
    if (item.ssjjTaskInfo.type === 4) {
      //关注店铺
      if (item.doneNum === item.ssjjTaskInfo.awardOfDayNum) {
        console.log(`${item.ssjjTaskInfo.name}已完成[${item.doneNum}/${item.ssjjTaskInfo.awardOfDayNum}]`)
        continue
      }
      for (let i = 0; i < new Array(item.ssjjTaskInfo.awardOfDayNum).fill('').length; i++) {
        await followShops('followShops', item.ssjjTaskInfo.id);//一键关注店铺
        await queryDoneTaskRecord(item.ssjjTaskInfo.id, item.ssjjTaskInfo.type);
      }
    }
    if (item.ssjjTaskInfo.type === 5) {
      //浏览店铺
      if (item.doneNum === item.ssjjTaskInfo.awardOfDayNum) {
        console.log(`${item.ssjjTaskInfo.name}已完成[${item.doneNum}/${item.ssjjTaskInfo.awardOfDayNum}]`)
        continue
      }
      for (let i = 0; i < new Array(item.ssjjTaskInfo.awardOfDayNum).fill('').length; i++) {
        await browseChannels('browseShops', item.ssjjTaskInfo.id, item.browseId);
      }
    }
    if (item.ssjjTaskInfo.type === 6) {
      //关注4个频道
      if (item.doneNum === item.ssjjTaskInfo.awardOfDayNum) {
        console.log(`${item.ssjjTaskInfo.name}已完成[${item.doneNum}/${item.ssjjTaskInfo.awardOfDayNum}]`)
        continue
      }
      await doChannelsListTask(item.ssjjTaskInfo.id, item.ssjjTaskInfo.type)
    }
    if (item.ssjjTaskInfo.type === 7) {
      //浏览3个频道
      if (item.doneNum === item.ssjjTaskInfo.awardOfDayNum) {
        console.log(`${item.ssjjTaskInfo.name}已完成[${item.doneNum}/${item.ssjjTaskInfo.awardOfDayNum}]`)
        continue
      }
      for (let i = 0; i < new Array(item.ssjjTaskInfo.awardOfDayNum || 1).fill('').length; i++) {
        await browseChannels('browseChannels', item.ssjjTaskInfo.id, item.browseId);
      }
    }
    isPurchaseShops = $.isNode() ? (process.env.PURCHASE_SHOPS ? process.env.PURCHASE_SHOPS : isPurchaseShops) : ($.getdata("isPurchaseShops") ? $.getdata("isPurchaseShops") : isPurchaseShops);
    if (isPurchaseShops && item.ssjjTaskInfo.type === 9) {
      //加购商品
      if (item.doneNum === item.ssjjTaskInfo.awardOfDayNum) {
        console.log(`${item.ssjjTaskInfo.name}已完成[${item.doneNum}/${item.ssjjTaskInfo.awardOfDayNum}]`)
        continue
      }
      for (let i = 0; i < new Array(item.ssjjTaskInfo.awardOfDayNum).fill('').length; i++) {
        await followShops('purchaseCommodities', item.ssjjTaskInfo.id);//一键加购商品
        await queryDoneTaskRecord(item.ssjjTaskInfo.id, item.ssjjTaskInfo.type);
      }
    }
    if (item.ssjjTaskInfo.type === 10) {
      //浏览商品
      if (item.doneNum === item.ssjjTaskInfo.awardOfDayNum) {
        console.log(`${item.ssjjTaskInfo.name}已完成[${item.doneNum}/${item.ssjjTaskInfo.awardOfDayNum}]`)
        continue
      }
      for (let i = 0; i < new Array(item.ssjjTaskInfo.awardOfDayNum).fill('').length; i++) {
        await browseChannels('browseCommodities', item.ssjjTaskInfo.id, item.browseId);
      }
    }
    if (item.ssjjTaskInfo.type === 11) {
      //浏览会场
      if (item.doneNum === item.ssjjTaskInfo.awardOfDayNum) {
        console.log(`${item.ssjjTaskInfo.name}已完成[${item.doneNum}/${item.ssjjTaskInfo.awardOfDayNum}]`)
        continue
      }
      for (let i = 0; i < new Array(item.ssjjTaskInfo.awardOfDayNum || 1).fill('').length; i++) {
        await browseChannels('browseMeetings' ,item.ssjjTaskInfo.id, item.browseId);
      }
      // await browseChannels('browseMeetings' ,item.ssjjTaskInfo.id, item.browseId);
      // await doAllTask();
    }
  }
}
function queryFurnituresCenterList() {
  return new Promise(resolve => {
    $.get(taskUrl(`ssjj-furnitures-center/queryFurnituresCenterList`), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.head.code === 200) {
              if (data.body) {
                let { buy, list } = data.body;
                $.canBuyList = [];
                list.map((item, index) => {
                  if (buy.some((buyItem) => buyItem === item.id)) return
                  $.canBuyList.push(item);
                })
                $.canBuyList.sort(sortByjdBeanNum);
                if ($.canBuyList[0].needWoB <= $.woB) {
                  await furnituresCenterPurchase($.canBuyList[0].id, $.canBuyList[0].jdBeanNum);
                } else {
                  console.log(`\n兑换${$.canBuyList[0].jdBeanNum}京豆失败:当前wo币${$.woB}不够兑换所需的${$.canBuyList[0].needWoB}WO币`)
                  message += `【装饰领京豆】兑换${$.canBuyList[0].jdBeanNum}京豆失败,原因:WO币不够\n`;
                }
                // for (let canBuyItem of $.canBuyList) {
                //   if (canBuyItem.needWoB <= $.woB) {
                //     await furnituresCenterPurchase(canBuyItem.id, canBuyItem.jdBeanNum);
                //     break
                //   }
                // }
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
//装饰领京豆
function furnituresCenterPurchase(id, jdBeanNum) {
  return new Promise(resolve => {
    $.post(taskPostUrl(`ssjj-furnitures-center/furnituresCenterPurchase/${id}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.head.code === 200) {
              message += `【装饰领京豆】${jdBeanNum}兑换成功\n`;
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

//获取详情
function queryByUserId() {
  return new Promise(resolve => {
    $.get(taskUrl(`ssjj-wo-home-info/queryByUserId/2`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.head.code === 200) {
              if (data.body) {
                message += `【小窝名】${data.body.name}\n`;
                $.woB = data.body.woB;
                message += `【当前WO币】${data.body.woB}\n`;
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
//获取需要关注的频道列表
function queryChannelsList(taskId) {
  return new Promise(resolve => {
    $.get(taskUrl(`ssjj-task-channels/queryChannelsList/${taskId}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.head.code === 200) {
              if (data.body) {
                $.queryChannelsList = data.body;
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

//浏览频道，浏览会场，浏览商品，浏览店铺API
function browseChannels(functionID ,taskId, browseId) {
  return new Promise(resolve => {
    $.get(taskUrl(`/ssjj-task-record/${functionID}/${taskId}/${browseId}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            console.log(`${functionID === 'browseChannels' ? '浏览频道' : functionID === 'browseMeetings' ? '浏览会场' : functionID === 'browseShops' ? '浏览店铺' : '浏览商品'}`, data)
            data = JSON.parse(data);
            if (data.head.code === 200) {
              if (data.body) {
                // message += `【限时连连看】成功，活动${awardWoB}WO币\n`;
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
//记录已关注的频道
function queryDoneTaskRecord(taskId, taskType) {
  return new Promise(resolve => {
    $.get(taskUrl(`/ssjj-task-record/queryDoneTaskRecord/${taskType}/${taskId}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.head.code === 200) {
              if (data.body) {
                // message += `【限时连连看】成功，活动${awardWoB}WO币\n`;
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
//一键关注店铺，一键加购商品API
function followShops(functionID, taskId) {
  return new Promise(async resolve => {
    $.get(taskUrl(`/ssjj-task-record/${functionID}/${taskId}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.head.code === 200) {
              if (data.body) {
                console.log(`${functionID === 'followShops'? '一键关注店铺': '一键加购商品'}结果：${data.head.msg}`);
                // message += `【限时连连看】成功，活动${awardWoB}WO币\n`;
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
//关注频道API
function followChannel(taskId, channelId) {
  return new Promise(async resolve => {
    $.get(taskUrl(`/ssjj-task-record/followChannel/${channelId}/${taskId}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.head.code === 200) {
              if (data.body) {
                // message += `【限时连连看】成功，活动${awardWoB}WO币\n`;
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
function createInviteUser() {
  return new Promise(resolve => {
    $.get(taskUrl(`/ssjj-task-record/createInviteUser`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.head.code === 200) {
              if (data.body) {
                if (data.body.id) {
                  console.log(`\n您的${$.name}shareCode(每天都是变化的):【${data.body.id}】\n`);
                  $.shareCode = data.body.id;
                  $.newShareCodes.push({ 'code': data.body.id, 'token': $.token, cookie });
                }
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function createAssistUser(inviteId, taskId) {
  console.log(`${inviteId}, ${taskId}`, `${cookie}`);
  return new Promise(resolve => {
    $.get(taskUrl(`/ssjj-task-record/createAssistUser/${inviteId}/${taskId}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.head.code === 200) {
              if (data.body) {
                console.log(`\n给好友${data.body.inviteId}:【${data.head.msg}】\n`)
              }
            } else {
              console.log(`助力失败${JSON.stringify(data)}}`);
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
function game(taskId, index, awardWoB = 100) {
  return new Promise(resolve => {
    $.get(taskUrl(`/ssjj-task-record/game/${index}/${taskId}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.head.code === 200) {
              if (data.body) {
                message += `【限时连连看】成功，活动${awardWoB}WO币\n`;
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
function clock(taskId, awardWoB) {
  return new Promise(resolve => {
    $.get(taskUrl(`/ssjj-task-record/clock/${taskId}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.head.code === 200) {
              if (data.body) {
                message += `【每日打卡】成功，活动${awardWoB}WO币\n`;
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
function queryAllTaskInfo() {
  return new Promise(resolve => {
    $.get(taskUrl(`ssjj-task-info/queryAllTaskInfo/2`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.head.code === 200) {
              if (data.body) {
                $.taskList = data.body;
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
//免费抽奖
function drawRecord(id) {
  return new Promise(resolve => {
    $.get(taskUrl(`ssjj-draw-record/draw/${id}`), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.head.code === 200) {
              if (data.body) {
                message += `【免费抽奖】获得：${data.body.name}\n`;
              } else {
                message += `【免费抽奖】未中奖\n`;
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
//查询免费抽奖机会
function queryDraw() {
  return new Promise(resolve => {
    $.get(taskUrl("ssjj-draw-center/queryDraw"), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.head.code === 200) {
              $.freeDrawCount = data.body.freeDrawCount;//免费抽奖次数
              $.lotteryId = data.body.center.id;
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
//查询是否开启了此活动
function ssjjRooms() {
  return new Promise(resolve => {
    $.get(taskUrl("ssjj-rooms/info/%E5%AE%A2%E5%8E%85"), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.head.code === 200) {
              $.isUnLock = data.body.isUnLock;
              if (!$.isUnLock) {
                console.log(`京东账号${$.index}${$.nickName}未开启此活动\n`);
                $.msg($.name, '', `京东账号${$.index}${$.nickName}未开启此活动\n点击弹窗去开启此活动(￣▽￣)"`, {"open-url": "openjd://virtual?params=%7B%20%22category%22:%20%22jump%22,%20%22des%22:%20%22m%22,%20%22url%22:%20%22https://h5.m.jd.com/babelDiy/Zeus/2HFSytEAN99VPmMGZ6V4EYWus1x/index.html%22%20%7D"});
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
function loginHome() {
  return new Promise(resolve => {
    const options = {
      "url": "https://jdhome.m.jd.com/saas/framework/encrypt/pin?appId=6d28460967bda11b78e077b66751d2b0",
      "headers": {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Length": "0",
        "Content-Type": "application/json",
        "Cookie": cookie,
        "Host": "jdhome.m.jd.com",
        "Origin": "https://jdhome.m.jd.com",
        "Referer": "https://jdhome.m.jd.com/dist/taro/index.html/",
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0"),
      }
    }
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            await login(data.data);
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}
function login(userName) {
  return new Promise(resolve => {
    const body = {
      "body": {
        "client": 2,
        userName
      }
    };
    const options = {
      "url": `${JD_API_HOST}/user-info/login`,
      "body": JSON.stringify(body),
      "headers": {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Type": "application/json",
        "Host": "lkyl.dianpusoft.cn",
        "Origin": "https://lkyl.dianpusoft.cn",
        "Referer": "https://h5.m.jd.com/babelDiy/Zeus/2HFSytEAN99VPmMGZ6V4EYWus1x/index.html",
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0"),
      }
    }
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data);
          if (data.head.code === 200) {
            $.token = data.head.token;
            $.helpToken.push(data.head.token)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
function updateInviteCode(url = 'https://raw.githubusercontent.com/LXK9301/updateTeam/master/jd_updateSmallHomeInviteCode.json') {
  return new Promise(resolve => {
    $.get({url}, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
        } else {
          $.inviteCodes = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
function updateInviteCodeCDN(url) {
  return new Promise(async resolve => {
    $.get({url, headers:{"User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0")}}, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          $.inviteCodes = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
    await $.wait(3000)
    resolve();
  })
}
function taskUrl(url, body = {}) {
  return {
    url: `${JD_API_HOST}/${url}?body=${escape(body)}`,
    headers: {
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "zh-CN,zh;q=0.9",
      "Connection": "keep-alive",
      "content-type": "application/json",
      "Host": "lkyl.dianpusoft.cn",
      "Referer": "https://h5.m.jd.com/babelDiy/Zeus/2HFSytEAN99VPmMGZ6V4EYWus1x/index.html",
      "token": $.token,
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0")
    }
  }
}
function taskPostUrl(url) {
  return {
    url: `${JD_API_HOST}/${url}`,
    headers: {
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "zh-CN,zh;q=0.9",
      "Connection": "keep-alive",
      "content-type": "application/json",
      "Host": "lkyl.dianpusoft.cn",
      "Referer": "https://h5.m.jd.com/babelDiy/Zeus/2HFSytEAN99VPmMGZ6V4EYWus1x/index.html",
      "token": $.token,
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0")
    }
  }
}
function sortByjdBeanNum(a, b) {
  return b['jdBeanNum'] - a['jdBeanNum'];
}
function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      "headers": {
        "Accept": "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0")
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data['retcode'] === 13) {
              $.isLogin = false; //cookie过期
              return
            }
            $.nickName = data['base'].nickname;
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
function safeGet(data) {
  try {
    if (typeof JSON.parse(data) == "object") {
      return true;
    }
  } catch (e) {
    console.log(e);
    console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
    return false;
  }
}
function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
      return [];
    }
  }
}
// prettier-ignore

function Env(t,s){return new class{constructor(t,s){this.name=t,this.data=null,this.dataFile="box.dat",this.logs=[],this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,s),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}getScript(t){return new Promise(s=>{$.get({url:t},(t,e,i)=>s(i))})}runScript(t,s){return new Promise(e=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let o=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");o=o?1*o:20,o=s&&s.timeout?s.timeout:o;const[h,a]=i.split("@"),r={url:`http://${a}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:o},headers:{"X-Key":h,Accept:"*/*"}};$.post(r,(t,s,i)=>e(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),s=this.path.resolve(process.cwd(),this.dataFile),e=this.fs.existsSync(t),i=!e&&this.fs.existsSync(s);if(!e&&!i)return{};{const i=e?t:s;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),s=this.path.resolve(process.cwd(),this.dataFile),e=this.fs.existsSync(t),i=!e&&this.fs.existsSync(s),o=JSON.stringify(this.data);e?this.fs.writeFileSync(t,o):i?this.fs.writeFileSync(s,o):this.fs.writeFileSync(t,o)}}lodash_get(t,s,e){const i=s.replace(/\[(\d+)\]/g,".$1").split(".");let o=t;for(const t of i)if(o=Object(o)[t],void 0===o)return e;return o}lodash_set(t,s,e){return Object(t)!==t?t:(Array.isArray(s)||(s=s.toString().match(/[^.[\]]+/g)||[]),s.slice(0,-1).reduce((t,e,i)=>Object(t[e])===t[e]?t[e]:t[e]=Math.abs(s[i+1])>>0==+s[i+1]?[]:{},t)[s[s.length-1]]=e,t)}getdata(t){let s=this.getval(t);if(/^@/.test(t)){const[,e,i]=/^@(.*?)\.(.*?)$/.exec(t),o=e?this.getval(e):"";if(o)try{const t=JSON.parse(o);s=t?this.lodash_get(t,i,""):s}catch(t){s=""}}return s}setdata(t,s){let e=!1;if(/^@/.test(s)){const[,i,o]=/^@(.*?)\.(.*?)$/.exec(s),h=this.getval(i),a=i?"null"===h?null:h||"{}":"{}";try{const s=JSON.parse(a);this.lodash_set(s,o,t),e=this.setval(JSON.stringify(s),i)}catch(s){const h={};this.lodash_set(h,o,t),e=this.setval(JSON.stringify(h),i)}}else e=$.setval(t,s);return e}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,s){return this.isSurge()||this.isLoon()?$persistentStore.write(t,s):this.isQuanX()?$prefs.setValueForKey(t,s):this.isNode()?(this.data=this.loaddata(),this.data[s]=t,this.writedata(),!0):this.data&&this.data[s]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,s=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?$httpClient.get(t,(t,e,i)=>{!t&&e&&(e.body=i,e.statusCode=e.status),s(t,e,i)}):this.isQuanX()?$task.fetch(t).then(t=>{const{statusCode:e,statusCode:i,headers:o,body:h}=t;s(null,{status:e,statusCode:i,headers:o,body:h},h)},t=>s(t)):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,s)=>{try{const e=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(e,null),s.cookieJar=this.ckjar}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:e,statusCode:i,headers:o,body:h}=t;s(null,{status:e,statusCode:i,headers:o,body:h},h)},t=>s(t)))}post(t,s=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),delete t.headers["Content-Length"],this.isSurge()||this.isLoon())$httpClient.post(t,(t,e,i)=>{!t&&e&&(e.body=i,e.statusCode=e.status),s(t,e,i)});else if(this.isQuanX())t.method="POST",$task.fetch(t).then(t=>{const{statusCode:e,statusCode:i,headers:o,body:h}=t;s(null,{status:e,statusCode:i,headers:o,body:h},h)},t=>s(t));else if(this.isNode()){this.initGotEnv(t);const{url:e,...i}=t;this.got.post(e,i).then(t=>{const{statusCode:e,statusCode:i,headers:o,body:h}=t;s(null,{status:e,statusCode:i,headers:o,body:h},h)},t=>s(t))}}time(t){let s={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in s)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?s[e]:("00"+s[e]).substr((""+s[e]).length)));return t}msg(s=t,e="",i="",o){const h=t=>!t||!this.isLoon()&&this.isSurge()?t:"string"==typeof t?this.isLoon()?t:this.isQuanX()?{"open-url":t}:void 0:"object"==typeof t&&(t["open-url"]||t["media-url"])?this.isLoon()?t["open-url"]:this.isQuanX()?t:void 0:void 0;this.isSurge()||this.isLoon()?$notification.post(s,e,i,h(o)):this.isQuanX()&&$notify(s,e,i,h(o)),this.logs.push("","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="),this.logs.push(s),e&&this.logs.push(e),i&&this.logs.push(i)}log(...t){t.length>0?this.logs=[...this.logs,...t]:console.log(this.logs.join(this.logSeparator))}logErr(t,s){const e=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();e?$.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):$.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(s=>setTimeout(s,t))}done(t={}){const s=(new Date).getTime(),e=(s-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${e} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,s)}
