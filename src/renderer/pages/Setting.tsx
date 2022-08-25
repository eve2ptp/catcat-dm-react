/* eslint-disable @typescript-eslint/no-shadow */
import {
  Flex,
  Divider,
  useColorMode,
  useToast,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  Progress,
  background,
} from '@chakra-ui/react';
import axios from 'axios';
import SettingSelectItem from 'renderer/components/SettingSelectItem';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import CatLog from 'renderer/utils/CatLog';
import SliderMenu from '../components/SliderMenu';
import styles from '../styles/setting.module.scss';
import SettingInputItem from '../components/SettingInputItem';
import { catConfigItem } from '../components/CatCat';
import pack from '../../../package.json';
// import '../samples/electron-store'
import SettingSwitchItem from '../components/SettingSwitchItem';
// const catConfig = window.catConfig
// catConfig.setDataPath('F://catConfig.json')

const Setting = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isUpdateOpen,
    onOpen: onUpdateOpen,
    onClose: onUpdateClose,
  } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const cancelUpdateRef = useRef<HTMLButtonElement>(null);
  const tempRoomId = 0;
  const toast = useToast();
  const obj: { [K: string]: any } = {};
  const [catConfigData, setCatConfigData] = useState(obj);
  const [state, setState] = useState(obj);
  const color = useColorMode();
  const load = (num: number) => {
    CatLog.console('on load user img and nickname');
    axios
      .get(`https://api.live.bilibili.com/room/v1/Room/room_init?id=${num}`)
      // eslint-disable-next-line func-names
      // eslint-disable-next-line promise/always-return
      .then(function (response) {
        // handle success
        console.log(response);
        const { uid } = response.data.data;
        axios.defaults.withCredentials = true;
        document.cookie = 'SESSDATA=xxxx';
        // eslint-disable-next-line promise/no-nesting
        axios({
          url: `https://api.live.bilibili.com/live_user/v1/Master/info?uid=${uid}`,
        })
          // eslint-disable-next-line func-names
          // eslint-disable-next-line promise/always-return
          // eslint-disable-next-line @typescript-eslint/no-shadow
          // eslint-disable-next-line func-names
          // eslint-disable-next-line promise/always-return
          .then(function (response1) {
            console.log(response1);
            setCatConfigData({
              ...catConfigData,
              faceImg: response1.data.data.info.face,
              nickname: response1.data.data.info.uname,
            });
          })
          // eslint-disable-next-line func-names
          .catch(function (error) {
            console.log(error);
          });
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
  };

  const setRoomId = (room: any) => {};
  const commonInputItemSave = (skey: any, value: string) => {
    let t: unknown = value;
    if (skey === 'roomid') {
      t = Number(value);
      setCatConfigData({
        ...catConfigData,
        roomid: Number(t),
      });
    }
    if (skey === 'roomtitle') {
      const arg = {
        title: value,
        roomid: catConfigData.roomid,
        SESSDATA: catConfigData.SESSDATA,
        csrf: catConfigData.csrf,
      };
      window.electron.ipcRenderer.updateRoomTitle('updateRoomTitle', [arg]);
    }
    window.electron.store.set(skey, t);
  };
  const { colorMode, toggleColorMode } = useColorMode();
  CatLog.console(colorMode);
  useEffect(() => {
    if (catConfigData.roomid) {
      load(catConfigData.roomid);
      commonInputItemSave('roomid', catConfigData.roomid);
    }
    if (catConfigData.allowUpdate) {
      axios
        .get(
          'https://api.github.com/repos/kokolokksk/catcat-dm-react/releases/latest'
        )
        .then((res) => {
          CatLog.console(res.data.tag_name);
          CatLog.console(res.data.name);
          CatLog.console(res.data.body);
          CatLog.console(res.data.html_url);
          CatLog.console(res.data.assets[0].browser_download_url);
          CatLog.console(res.data.assets[0].name);
          CatLog.console(res.data.assets[0].size);
          CatLog.console(res.data.assets[0].updated_at);
          CatLog.console(res.data.assets[0].created_at);
          CatLog.console(res.data.assets[0].content_type);
          setState({
            ...state,
            downtext: '后台下载',
            transferred: 0,
            total: 0,
            version: res.data.tag_name,
            name: res.data.name,
            body: res.data.body,
            html_url: res.data.html_url,
            browser_download_url: res.data.assets[0].browser_download_url,
            file_name: res.data.assets[0].name,
            size: res.data.assets[0].size,
            updated_at: res.data.assets[0].updated_at,
            created_at: res.data.assets[0].created_at,
            content_type: res.data.assets[0].content_type,
          });
          CatLog.console(pack.version, res.data.tag_name);
          if (
            parseInt(pack.version.replaceAll('.', ''), 10) <
            parseInt(
              res.data.tag_name.replaceAll('v', '').replaceAll('.', ''),
              10
            )
          ) {
            CatLog.console('update');
            onOpen();
          } else {
            CatLog.console('no update');
          }
          return '';
        })
        .catch((e) => {
          CatLog.console(e.message);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catConfigData.roomid]);
  const commonSwitchItemSave = async (skey: any, value: any) => {
    CatLog.console(value.target.checked);
    window.electron.store.set(skey, value.target.checked);
    if (skey === 'darkMode') {
      toggleColorMode();
      // const isDarkMode = window.darkMode.toggle(value.target.checked);
      window.electron.ipcRenderer.sendMessage(
        'dark-mode:toggle',
        value.target.checked
      );
    }
    if (skey === 'alwaysOnTop') {
      // set is on top
      window.electron.ipcRenderer.sendMessage('setOnTop:setting', [
        value.target.checked,
      ]);
    }
  };
  const commonSelectItemSave = async (skey: any, value: any) => {
    window.electron.store.set(skey, value.target.value);
    if (skey === 'theme') {
      setCatConfigData({
        ...catConfigData,
        theme: value.target.value,
      });
      window.electron.ipcRenderer.sendMessage(
        'theme:change',
        value.target.value
      );
    }
  };
  useEffect(() => {
    // init data
    CatLog.console('init data');
    window.danmuApi.msgTips((_event: any, data: any) => {
      CatLog.console(data);
      toast({
        title: '提示',
        description: data,
        status: data === '修改成功' ? 'success' : 'error',
        duration: 2000,
        isClosable: true,
      });
    });
    window.danmuApi.updateMessage((_event: any, data: any) => {
      CatLog.console(data);
      if (data === 'Update downloaded') {
        setState({
          ...state,
          downtext: '下载完成',
        });
      }
    });
    window.danmuApi.downProgress((_event: any, data: any) => {
      CatLog.console(data);
      setState({
        ...state,
        progress: data[0],
        transferred: data[1],
        total: data[2],
      });
    });
    const arr = catConfigItem.map((item) =>
      window.electron.store.get(item.name)
    );
    // eslint-disable-next-line promise/catch-or-return
    Promise.all(arr).then((e) => {
      console.log(e);
      // eslint-disable-next-line array-callback-return
      e.map((item: any, index: number) => {
        if (typeof item === catConfigItem[index].type) {
          CatLog.console(item);
          catConfigData[catConfigItem[index].name] = item;
        }
      });
      // eslint-disable-next-line promise/always-return
      try {
        if (!catConfigData.clientId) {
          // eslint-disable-next-line promise/no-nesting
          axios
            .get('https://db.loli.monster/cat/client/generateClientId')
            // eslint-disable-next-line promise/always-return
            .then(function (response) {
              // handle success
              console.log(response);
              catConfigData.clientId = response.data;
              commonInputItemSave('clientId', response.data);
            })
            .catch(function (error: unknown) {
              // handle error
              console.log(error);
            });
        }
        if (catConfigData.roomid) {
          load(catConfigData.roomid);
        }
      } catch (e) {
        catConfigData.clientId = 'NetworkError';
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { theme } = catConfigData;
  let pageTheme;
  switch (theme) {
    case 'light':
      pageTheme = styles.page;
      break;
    case 'dark':
      pageTheme = styles.pageDark;
      break;
    default:
      pageTheme = styles.page;
      break;
  }
  const updateApp = () => {
    CatLog.console('update app');
    window.electron.ipcRenderer.sendMessage('update:app', []);
  };
  return (
    <Flex height="100vh">
      <SliderMenu
        theme={catConfigData.theme}
        nickname={catConfigData.nickname}
        faceImg={catConfigData.faceImg}
      />
      <Divider orientation="vertical" />
      <div className={pageTheme}>
        <div className={styles.setting}>
          <SettingInputItem
            name="房间号"
            theme={catConfigData.theme}
            v={catConfigData.roomid}
            c={commonInputItemSave}
            skey="roomid"
          />
          <SettingInputItem
            name="更新直播间标题"
            theme={catConfigData.theme}
            v={catConfigData.roomtitle}
            c={commonInputItemSave}
            skey="roomtitle"
          />
          <Divider />
          <SettingInputItem
            theme={catConfigData.theme}
            name="弹幕阴影"
            v={catConfigData.dmTs || '1px 1px 1px #fff'}
            c={commonInputItemSave}
            skey="dmTs"
          />
          <Divider />
          <SettingSwitchItem
            name="弹幕窗口置顶"
            theme={catConfigData.theme}
            v={catConfigData.alwaysOnTop}
            c={commonSwitchItemSave}
            skey="alwaysOnTop"
          />
          <Divider />
          {/* <SettingSwitchItem
            name="弹幕上传"
            v={catConfigData.catdb}
            c={commonSwitchItemSave}
            skey="catdb"
          />
          <Divider /> */}
          {/* <SettingSwitchItem
            name="波浪"
            theme={catConfigData.theme}
            v={catConfigData.wave || false}
            c={commonSwitchItemSave}
            skey="wave"
          />
          <Divider /> */}
          {/*
          <SettingSwitchItem
            name="粉丝牌显示"
            v={catConfigData.fansDisplay || false}
            c={commonSwitchItemSave}
            skey="fansDisplay"
          />
          <Divider /> */}
          {/* <SettingSwitchItem
            name="深浅模式"
            v={catConfigData.darkMode || false}
            c={commonSwitchItemSave}
            skey="darkMode"
          />
          <Divider /> */}
          <SettingSelectItem
            name="主题"
            theme={catConfigData.theme}
            v={catConfigData.theme || 'light'}
            c={commonSelectItemSave}
            skey="theme"
          />
          <Divider />
          {/* <SettingSwitchItem
            name="使用代理服务器请求弹幕用户头像"
            v={catConfigData.proxyApi || false}
            c={commonSwitchItemSave}
            skey="proxyApi"
          /> */}
          <Divider />
          <SettingSwitchItem
            name="TTS感谢礼物"
            theme={catConfigData.theme}
            v={catConfigData.ttsGift || false}
            c={commonSwitchItemSave}
            skey="ttsGift"
          />
          <Divider />
          <SettingSwitchItem
            name="TTS阅读弹幕"
            theme={catConfigData.theme}
            v={catConfigData.ttsDanmu || false}
            c={commonSwitchItemSave}
            skey="ttsDanmu"
          />
          <Divider />
          <SettingSwitchItem
            name="允许检测更新"
            theme={catConfigData.allowUpdate}
            v={catConfigData.allowUpdate || false}
            c={commonSwitchItemSave}
            skey="allowUpdate"
          />
          {/* <Divider/>
        <SettingSwitchItem name='TTS' v={catConfigData.tts || false} c={commonSwitchItemSave} skey={'tts'}/>
        <Divider/>
        <SettingSwitchItem name='礼物感谢' v={catConfigData.ttsGift || false} c={commonSwitchItemSave} skey={'ttsGift'}/> */}
          <Divider />
          <SettingInputItem
            name="SESSDATA"
            theme={catConfigData.theme}
            v={catConfigData.SESSDATA || '-'}
            c={commonInputItemSave}
            skey="SESSDATA"
          />
          <Divider />
          <SettingInputItem
            name="csrf"
            theme={catConfigData.theme}
            v={catConfigData.csrf || '-'}
            c={commonInputItemSave}
            skey="csrf"
          />
          <Divider />
          <SettingInputItem
            name="TTS KEY"
            theme={catConfigData.theme}
            v={catConfigData.ttsKey || '-'}
            c={commonInputItemSave}
            skey="ttsKey"
          />
          <Divider />
          {/* <ColorSelectContainer c={commonInputItemSave}/> */}
        </div>
      </div>
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              更新提示
            </AlertDialogHeader>

            <AlertDialogBody>
              <b>{state.version}</b>版本已经发布，是否更新?
              <p />
              <ReactMarkdown>{state.body}</ReactMarkdown>
              {state.updated_at}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                colorScheme="green"
                onClick={() => {
                  updateApp();
                  onClose();
                  onUpdateOpen();
                }}
                className=" ml-4 mr-2"
              >
                确定
              </Button>
              <Button ref={cancelRef} onClick={onClose}>
                取消
              </Button>
              <Button
                colorScheme="gray"
                onClick={() => {
                  onClose();
                  setCatConfigData({
                    ...catConfigData,
                    allowUpdate: false,
                  });
                  window.electron.store.set('allowUpdate', false);
                }}
                ml={3}
              >
                不再提示
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      <AlertDialog
        isOpen={isUpdateOpen}
        leastDestructiveRef={cancelUpdateRef}
        onClose={onUpdateClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              更新中
            </AlertDialogHeader>

            <AlertDialogBody>
              <Progress colorScheme="green" size="sm" value={state.progress} />
              <p />
              {state.transferred}/{state.total}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                colorScheme="green"
                onClick={() => {
                  onUpdateClose();
                }}
                className=" ml-4 mr-2"
              >
                {state.downtext}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>
  );
};

export default Setting;
