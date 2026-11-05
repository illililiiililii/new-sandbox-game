const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('node:path');
let win, room;
app.setName('ORBIT FOUNDRY');
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
else {
  app.on('second-instance', () => { if(win){if(win.isMinimized())win.restore();win.focus();} });
  app.whenReady().then(async () => {
    const area=screen.getPrimaryDisplay().workAreaSize;
    win=new BrowserWindow({width:Math.min(1500,area.width),height:Math.min(960,area.height),minWidth:1000,minHeight:680,backgroundColor:'#101010',title:'ORBIT FOUNDRY · 궤도 공방',autoHideMenuBar:true,show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
    win.setMenu(null);win.loadFile(path.join(__dirname,'dist/forge.html'));
    win.once('ready-to-show',()=>{win.show();});
    win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
    win.webContents.on('will-navigate',event=>event.preventDefault());
    ipcMain.handle('app:info',()=>({version:app.getVersion(),platform:process.platform}));
    ipcMain.handle('app:fullscreen',()=>{win.setFullScreen(!win.isFullScreen());return win.isFullScreen();});
    ipcMain.handle('app:minimize',()=>win.minimize());
    ipcMain.handle('app:quit',()=>app.quit());
    const fs=require('node:fs/promises');
    const savePath=path.join(app.getPath('userData'),'orbit-world.json');
    const saveWorld=async(data)=>{await fs.mkdir(path.dirname(savePath),{recursive:true});const tmp=savePath+'.tmp';await fs.writeFile(tmp,JSON.stringify(data),'utf8');await fs.rename(tmp,savePath);return true;};
    ipcMain.handle('world:load',async()=>{try{return JSON.parse(await fs.readFile(savePath,'utf8'));}catch{return null;}});
    ipcMain.handle('world:save',async(_e,data)=>{if(!data||!Array.isArray(data.nodes)||data.nodes.length>700)return false;return saveWorld(data);});
    ipcMain.handle('lan:host',async(_e,options={})=>{
      if(room)await room.close();
      try{const {createRoomServer}=await import('./forge-server.mjs');room=await createRoomServer({saved:options.saved||null,seed:options.seed||8241});return {ok:true,url:`ws://127.0.0.1:${room.port}/signal`,token:room.hostToken,addresses:room.addresses};}
      catch(e){return {ok:false,error:e.code==='EADDRINUSE'?'3579 포트가 사용 중입니다. 다른 공방 서버를 종료해 주세요.':e.message};}
    });
    ipcMain.handle('lan:stop',async()=>{if(room){await saveWorld(room.forge.save());await room.close();room=null;}return true;});
    ipcMain.handle('app:clipboard',(_e,text)=>{if(typeof text==='string'&&text.length<200)require('electron').clipboard.writeText(text);});
  });
  app.on('window-all-closed',()=>app.quit());
  app.on('before-quit',()=>{if(room)room.close();});
}
