using System;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Diagnostics;
using System.Windows.Forms;

class OrbitLauncher : Form {
 static readonly Color Bg=Color.FromArgb(16,22,19), Card=Color.FromArgb(24,35,28), Green=Color.FromArgb(0,217,146), Muted=Color.FromArgb(142,166,151);
 readonly string root=AppDomain.CurrentDomain.BaseDirectory;
 readonly string config=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"OrbitFoundryLauncher","game-path.txt");
 Label status;string game="";bool smoke;
 [STAThread] static void Main(string[] args){Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);Application.Run(new OrbitLauncher(Array.IndexOf(args,"--smoke")>=0));}
 OrbitLauncher(bool test){smoke=test;Text="ORBIT LAUNCHER · 게임 런처";ClientSize=new Size(760,470);MinimumSize=new Size(776,509);MaximumSize=MinimumSize;StartPosition=FormStartPosition.CenterScreen;BackColor=Bg;ForeColor=Color.FromArgb(238,246,241);Font=new Font("Segoe UI",10);FormBorderStyle=FormBorderStyle.FixedSingle;MaximizeBox=false;
  string icon=Path.Combine(root,"orbit.ico");if(File.Exists(icon))Icon=new Icon(icon);
  Label title=LabelAt("ORBIT / LAUNCHER",30,25,600,35,20,Green);title.Font=new Font("Segoe UI",20,FontStyle.Bold);
  LabelAt("당신의 작은 우주로, 바로 출발하세요.",32,68,670,25,11,Muted);
  Panel gamePanel=PanelAt(30,112,700,152);LabelIn(gamePanel,"궤도 공방",22,17,450,30,20,ForeColor);LabelIn(gamePanel,"3D 물리 샌드박스  ·  1—4인 LAN 협동",24,55,580,23,10,Muted);
  Button start=ButtonIn(gamePanel,"게임 시작  ↗",23,94,205,40,true);start.Click+=(s,e)=>LaunchGame();
  Button choose=ButtonIn(gamePanel,"게임 위치 선택",239,94,155,40,false);choose.Click+=(s,e)=>PickGame();
  Button download=ButtonIn(gamePanel,"다운로드",405,94,127,40,false);download.Click+=(s,e)=>Open("https://github.com/illililiiililii/new-sandbox-game/releases/latest");
  Panel mod=PanelAt(30,278,700,111);LabelIn(mod,"일베크래프트",22,15,250,27,16,ForeColor);LabelIn(mod,"Minecraft 1.21.11 / Fabric",24,47,300,20,10,Muted);
  Button files=ButtonIn(mod,"모드 파일 열기",340,35,160,40,false);files.Click+=(s,e)=>OpenModsFiles();
  Button folder=ButtonIn(mod,"Minecraft mods",511,35,165,40,false);folder.Click+=(s,e)=>{string p=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),".minecraft","mods");Directory.CreateDirectory(p);Open(p);SetStatus("기본 Minecraft mods 폴더를 열었습니다. 다른 런처는 해당 인스턴스 폴더를 사용하세요.");};
  status=LabelAt("게임 위치를 확인하는 중…",32,407,690,22,9,Muted);
  LabelAt("OFFLINE DESKTOP LAUNCHER  /  v1.0",32,440,600,18,8,Color.FromArgb(82,120,96));
  game=DetectGame();SetStatus(File.Exists(game)?"준비됨  ·  "+game:"게임 위치를 선택하거나 다운로드해 주세요.");
  Shown+=(s,e)=>{if(smoke){var timer=new Timer();timer.Interval=350;timer.Tick+=(a,b)=>{timer.Stop();using(var image=new Bitmap(Width,Height)){DrawToBitmap(image,new Rectangle(0,0,Width,Height));image.Save(Path.Combine(root,"launcher-preview.png"));}File.WriteAllText(Path.Combine(root,"smoke-ok.txt"),"GUI initialized; controls="+Controls.Count+"; gameFound="+File.Exists(game));Close();};timer.Start();}};
 }
 Panel PanelAt(int x,int y,int w,int h){Panel p=new Panel{Location=new Point(x,y),Size=new Size(w,h),BackColor=Card};p.Paint+=(s,e)=>{using(var pen=new Pen(Color.FromArgb(48,76,58)))e.Graphics.DrawRectangle(pen,0,0,w-1,h-1);};Controls.Add(p);return p;}
 Label LabelAt(string text,int x,int y,int w,int h,int size,Color color){Label l=new Label{Text=text,Location=new Point(x,y),Size=new Size(w,h),ForeColor=color,Font=new Font("Segoe UI",size),AutoEllipsis=true};Controls.Add(l);return l;}
 void LabelIn(Panel panel,string text,int x,int y,int w,int h,int size,Color color){Label l=new Label{Text=text,Location=new Point(x,y),Size=new Size(w,h),ForeColor=color,Font=new Font("Segoe UI",size),BackColor=Card};panel.Controls.Add(l);}
 Button ButtonIn(Panel p,string text,int x,int y,int w,int h,bool primary){Button b=new Button{Text=text,Location=new Point(x,y),Size=new Size(w,h),FlatStyle=FlatStyle.Flat,BackColor=primary?Green:Color.FromArgb(21,39,28),ForeColor=primary?Color.FromArgb(7,38,25):Color.FromArgb(209,234,218),Cursor=Cursors.Hand};b.FlatAppearance.BorderColor=primary?Green:Color.FromArgb(65,99,75);b.FlatAppearance.MouseOverBackColor=primary?Color.FromArgb(91,239,182):Color.FromArgb(32,64,43);p.Controls.Add(b);return b;}
 string DetectGame(){try{if(File.Exists(config)){string s=File.ReadAllText(config).Trim();if(File.Exists(s))return s;}}catch{}string[] candidates={Path.Combine(root,"ORBIT FOUNDRY.exe"),Path.Combine(root,"ORBIT FOUNDRY-win32-x64","ORBIT FOUNDRY.exe"),Path.GetFullPath(Path.Combine(root,"..","ORBIT FOUNDRY-win32-x64","ORBIT FOUNDRY.exe"))};foreach(string s in candidates)if(File.Exists(s))return s;return "";}
 void PickGame(){using(OpenFileDialog dlg=new OpenFileDialog()){dlg.Title="ORBIT FOUNDRY.exe 선택";dlg.Filter="ORBIT FOUNDRY.exe|ORBIT FOUNDRY.exe|실행 파일|*.exe";if(dlg.ShowDialog()!=DialogResult.OK)return;game=dlg.FileName;try{Directory.CreateDirectory(Path.GetDirectoryName(config));File.WriteAllText(config,game);}catch{}SetStatus("게임 위치 저장됨  ·  "+game);}}
 void LaunchGame(){if(!File.Exists(game)){PickGame();if(!File.Exists(game))return;}try{Process.Start(new ProcessStartInfo(game){WorkingDirectory=Path.GetDirectoryName(game),UseShellExecute=true});SetStatus("궤도 공방을 실행했습니다.");}catch(Exception ex){MessageBox.Show(this,ex.Message,"실행 오류",MessageBoxButtons.OK,MessageBoxIcon.Error);}}
 void OpenModsFiles(){string p=Path.GetFullPath(Path.Combine(root,"..","ilbecraft"));if(Directory.Exists(p))Open(p);else Open("https://github.com/illililiiililii/ilbecraft-P/tree/main/releases/1.0.0");}
 void Open(string path){try{Process.Start(new ProcessStartInfo(path){UseShellExecute=true});}catch(Exception ex){SetStatus(ex.Message);}}
 void SetStatus(string message){status.Text=message;}
}
