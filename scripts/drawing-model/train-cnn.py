from pathlib import Path
import base64, gzip, json, math, re, sys, time
import numpy as np
from PIL import Image, ImageDraw
import torch
from torch import nn
from torch.nn import functional as F
ROOT=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/private/tmp/adam-portfolio-mnist')
torch.set_num_threads(4); torch.manual_seed(73); rng=np.random.default_rng(73)

def normalize(a):
    active=np.argwhere(a>5)
    if not len(active): return np.zeros((28,28),np.uint8)
    y0,x0=active.min(0); y1,x1=active.max(0)+1
    crop=Image.fromarray(a[y0:y1,x0:x1]); scale=20/max(crop.size)
    w,h=max(1,round(crop.width*scale)),max(1,round(crop.height*scale))
    crop=crop.resize((w,h),Image.Resampling.BILINEAR)
    out=Image.new('L',(28,28));out.paste(crop,((28-w)//2,(28-h)//2));a=np.asarray(out)
    yy,xx=np.mgrid[:28,:28];mass=a.sum()
    dx=round(13.5-(xx*a).sum()/mass);dy=round(13.5-(yy*a).sum()/mass)
    shifted=Image.new('L',(28,28)); shifted.paste(out,(dx,dy))
    return np.array(shifted)

def mnist(prefix):
    raw=gzip.decompress((ROOT/f'{prefix}-images-idx3-ubyte.gz').read_bytes())
    a=np.frombuffer(raw,np.uint8,offset=16).reshape(-1,28,28)
    raw=gzip.decompress((ROOT/f'{prefix}-labels-idx1-ubyte.gz').read_bytes())
    y=np.frombuffer(raw,np.uint8,offset=8).copy()
    return np.stack([normalize(i) for i in a]),y

def strokes(name):
    text=(ROOT/f'pendigits/pendigits-orig.{name}').read_text();out=[]
    for chunk in text.split('.SEGMENT DIGIT')[1:]:
        digit=int(re.search(r'"(\d)"',chunk)[1]);writer=int(re.search(r'\.COMMENT\s+\d+\s+(\d+)',chunk)[1]);paths=[]
        for path in chunk.split('.PEN_DOWN')[1:]:
            rows=re.findall(r'^\s*(-?\d+)\s+(-?\d+)\s*$',path.split('.PEN_UP')[0],re.M)
            paths.append(np.array([(int(x),-int(y)) for x,y in rows],float))
        out.append((digit,writer,paths))
    return out

def raster(paths,fraction=1,width=4):
    points=np.concatenate(paths);low=points.min(0);extent=max(np.ptp(points,axis=0).max(),1)
    paths=[(p-low)*48/extent+8 for p in paths]
    lengths=[np.linalg.norm(np.diff(p,axis=0),axis=1).sum() for p in paths];budget=sum(lengths)*fraction
    image=Image.new('L',(64,64));draw=ImageDraw.Draw(image)
    for path,length in zip(paths,lengths):
        kept=[tuple(path[0])]
        for a,b in zip(path,path[1:]):
            distance=np.linalg.norm(b-a)
            if budget>=distance:
                kept.append(tuple(b));budget-=distance
            else:
                if distance>0: kept.append(tuple(a+(b-a)*budget/distance))
                budget=0;break
        if len(kept)>1: draw.line(kept,fill=255,width=width,joint='curve')
        for x,y in kept: draw.ellipse((x-width/2,y-width/2,x+width/2,y+width/2),fill=255)
        if budget<=0: break
    return normalize(np.array(image))

# Fixed hand-drawn regression cases, never used for optimization.
t=np.linspace(0,2*math.pi,45)
ell=lambda cx,cy,rx,ry:[[cx+rx*math.cos(a),cy+ry*math.sin(a)] for a in t]
digit_paths={
0:[ell(.5,.5,.36,.46)],
1:[[[.3,.2],[.5,.06],[.5,.95]]],
2:[[[.12,.24],[.18,.12],[.4,.05],[.7,.06],[.86,.2],[.82,.37],[.65,.53],[.42,.7],[.14,.93],[.87,.93]]],
3:[[[.15,.12],[.4,.04],[.7,.08],[.84,.24],[.74,.4],[.5,.47],[.72,.53],[.86,.7],[.77,.89],[.52,.96],[.2,.88]]],
4:[[[.61,.07],[.1,.64],[.89,.64]],[[.64,.07],[.64,.96]]],
5:[[[.85,.08],[.22,.08],[.18,.48],[.47,.44],[.72,.5],[.85,.66],[.77,.87],[.55,.96],[.25,.88],[.12,.8]]],
6:[[[.75,.05],[.52,.13],[.26,.4],[.14,.7],[.22,.88],[.45,.95],[.7,.86],[.8,.68],[.72,.51],[.53,.44],[.28,.5],[.14,.7]]],
7:[[[.12,.08],[.9,.08],[.42,.96]]],
8:[[[.5,.48],[.25,.35],[.19,.19],[.3,.06],[.53,.04],[.75,.15],[.78,.31],[.5,.48],[.22,.65],[.16,.83],[.34,.96],[.59,.96],[.8,.81],[.77,.64],[.5,.48]]],
9:[ell(.45,.3,.29,.25),[[.72,.18],[.76,.46],[.69,.71],[.55,.95]]]
}
regression=[];reg_labels=[];reg_full=[];reg_meta=[]
for digit,paths in digit_paths.items():
    for size,offset in [(190,(45,40)),(130,(25,20)),(130,(120,125)),(95,(50,150)),(190,(20,60))]:
        image=Image.new('L',(280,280));draw=ImageDraw.Draw(image)
        for path in paths:
            p=[(offset[0]+x*size,offset[1]+y*size) for x,y in path]
            draw.line(p,fill=255,width=16,joint='curve')
            for x,y in p:draw.ellipse((x-8,y-8,x+8,y+8),fill=255)
        a=np.array(image);reg_full.append(np.array(image.resize((28,28),Image.Resampling.BILINEAR)));regression.append(normalize(a));reg_labels.append(digit);reg_meta.append({'digit':digit,'size':size,'offset':offset})
np.savez(ROOT/'drawn-regression.npz',input=np.stack(regression),previous_input=np.stack(reg_full),labels=reg_labels)
(ROOT/'drawn-paths.json').write_text(json.dumps(digit_paths))

# Validation writers are excluded from optimization; the original test writers stay held out.
start=time.time(); mx,my=mnist('train');mt,mty=mnist('t10k');pen=strokes('tra');pt=strokes('tes')
train_pen=[r for r in pen if r[1]<=25];val_pen=[r for r in pen if r[1]>25]
observed=[mx[:55000]];targets=[mx[:55000]];labels=[my[:55000]];is_pen=[np.zeros(55000,bool)]
for repeat in range(4):
    obs=[];full=[];ys=[]
    for digit,writer,paths in train_pen:
        width=int(rng.integers(3,8));fraction=1 if repeat<2 else float(rng.uniform(.4,.95))
        obs.append(raster(paths,fraction,width));full.append(raster(paths,1,width));ys.append(digit)
    observed.append(np.stack(obs));targets.append(np.stack(full));labels.append(np.array(ys));is_pen.append(np.ones(len(ys),bool))
x=torch.from_numpy(np.concatenate(observed)).float()[:,None]/255
full=torch.from_numpy(np.concatenate(targets)).float()[:,None]/255
y=torch.from_numpy(np.concatenate(labels)).long();pen_flags=torch.from_numpy(np.concatenate(is_pen))
val_x=torch.from_numpy(np.concatenate([mx[55000:],np.stack([raster(p) for d,w,p in val_pen])])).float()[:,None]/255
val_y=torch.from_numpy(np.concatenate([my[55000:],[d for d,w,p in val_pen]])).long()
print('Prepared',len(x),'training pairs and',len(val_x),'validation images; CPU',flush=True)
class Sketch(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv=nn.Sequential(nn.Conv2d(1,8,3,padding=1),nn.ReLU(),nn.MaxPool2d(2),nn.Conv2d(8,16,3,padding=1),nn.ReLU(),nn.MaxPool2d(2))
        self.encoder=nn.Sequential(nn.Flatten(),nn.Linear(16*7*7,96),nn.ReLU(),nn.Linear(96,32),nn.ReLU())
        self.classifier=nn.Linear(32,10)
        self.decoder=nn.Sequential(nn.Linear(32,256),nn.ReLU(),nn.Linear(256,784))
    def forward(self,x):
        state=self.encoder(self.conv(x));return state,self.classifier(state),self.decoder(state)
model=Sketch();opt=torch.optim.AdamW(model.parameters(),lr=.001,weight_decay=.0001)

def augment(inp,target):
    n=len(inp);angle=(torch.rand(n)-.5)*.5;scale=.85+torch.rand(n)*.3
    theta=torch.zeros(n,2,3);theta[:,0,0]=angle.cos()*scale;theta[:,0,1]=-angle.sin()*scale;theta[:,1,0]=angle.sin()*scale;theta[:,1,1]=angle.cos()*scale
    theta[:,:,2]=(torch.rand(n,2)-.5)*.11;theta[:,0,1]+=(torch.rand(n)-.5)*.18
    grid=F.affine_grid(theta,inp.shape,align_corners=False)
    return F.grid_sample(inp,grid,align_corners=False),F.grid_sample(target,grid,align_corners=False)

def classify(inp):
    model.eval()
    with torch.no_grad():return torch.cat([model(b)[1] for b in inp.split(512)])
best=0
for epoch in range(20):
    model.train()
    for ids in torch.randperm(len(x)).split(256):
        inp,target=augment(x[ids],full[ids]);state,logits,decoded=model(inp)
        loss=F.cross_entropy(logits,y[ids],label_smoothing=.04)+.75*F.binary_cross_entropy_with_logits(decoded,target.flatten(1))
        opt.zero_grad();loss.backward();opt.step()
    logits=classify(val_x);accuracy=(logits.argmax(1)==val_y).float().mean().item()
    if accuracy>best:best=accuracy;torch.save(model.state_dict(),ROOT/'cnn-best.pt')
    print('epoch',epoch+1,'validation',round(accuracy,4),'seconds',round(time.time()-start,1),flush=True)
    if epoch==11:
        for group in opt.param_groups:group['lr']=.00035
model.load_state_dict(torch.load(ROOT/'cnn-best.pt',weights_only=True));model.eval()
reg=torch.from_numpy(np.stack(regression)).float()[:,None]/255
reg_logits=classify(reg);reg_pred=reg_logits.argmax(1).numpy();reg_acc=(reg_pred==reg_labels).mean()
print('Regression',int((reg_pred==reg_labels).sum()),'/',len(reg_labels),'failures',[m|{'guess':int(p)} for m,p,y0 in zip(reg_meta,reg_pred,reg_labels) if p!=y0],flush=True)
# Temperature is chosen on validation data, not the held-out test writers.
temperatures=torch.linspace(.7,2.5,37);temperature=float(min(temperatures,key=lambda t:F.cross_entropy(logits/t,val_y).item()))
test=torch.from_numpy(mt).float()[:,None]/255; test_logits=classify(test)
pen_full=torch.from_numpy(np.stack([raster(p) for d,w,p in pt])).float()[:,None]/255
pen_y=torch.tensor([d for d,w,p in pt]);pen_logits=classify(pen_full)
pen_partial=torch.from_numpy(np.stack([raster(p,.65) for d,w,p in pt])).float()[:,None]/255
partial_logits=classify(pen_partial)
with torch.no_grad():
    reps=torch.cat([model(b)[0] for b in val_x.split(512)])
    scales=reps.quantile(.99,dim=0).clamp(min=.5).numpy().tolist()
    reconstruction=torch.cat([model(b)[2].sigmoid() for b in pen_partial.split(512)])
    completion_score=(classify(reconstruction.reshape(-1,1,28,28)).argmax(1)==pen_y).float().mean().item()
weights=np.concatenate([p.detach().numpy().reshape(-1) for p in model.parameters()]).astype('<f4')
examples=[]
for digit in [7,3,8,2,5,9,0,1,4,6]:
    # Examples are training-writer trajectories; tests do not become demo presets.
    candidate=next(p for d,w,p in train_pen if d==digit)
    points=np.concatenate(candidate);low=points.min(0);scale=180/max(np.ptp(points,axis=0).max(),1)
    paths=[np.round((p-low)*scale+50,2).tolist() for p in candidate]
    examples.append({'digit':digit,'strokes':paths})
asset={'conv':[[1,8,3,28],[8,16,3,14]],'encoder':[784,96,32],'classifier':[32,10],'decoder':[32,256,784],'temperature':temperature,'stateScale':scales,'weights':base64.b64encode(weights.tobytes()).decode(),'examples':examples}
(ROOT/'cnn-model.js').write_text('/* Shared convolutional encoder trained on MNIST images and UCI pen trajectories. Local inference. */\nwindow.digitModel = '+json.dumps(asset,separators=(',',':'))+';\n')
report={'seed':73,'device':'cpu','epochs':20,'validation_accuracy':best,'mnist_test_accuracy':(test_logits.argmax(1)==torch.from_numpy(mty)).float().mean().item(),'held_out_pen_writer_accuracy':(pen_logits.argmax(1)==pen_y).float().mean().item(),'65_percent_stroke_accuracy':(partial_logits.argmax(1)==pen_y).float().mean().item(),'65_percent_completion_recognition':completion_score,'drawn_regression':int((reg_pred==reg_labels).sum()),'drawn_regression_count':len(reg_labels),'temperature':temperature,'parameters':len(weights),'training_seconds':round(time.time()-start,2),'training_pairs':len(x),'validation_images':len(val_x),'pen_test_images':len(pt)}
(ROOT/'cnn-report.json').write_text(json.dumps(report,indent=2));print(report,flush=True)
parity=torch.cat([test[:20],pen_full[:20],pen_partial[:20],reg])
with torch.no_grad():state,logits,decoded=model(parity)
(ROOT/'cnn-parity.json').write_text(json.dumps({'images':parity.flatten(1).numpy().tolist(),'state':state.numpy().tolist(),'probabilities':(logits/temperature).softmax(1).numpy().tolist(),'completion':decoded.sigmoid().numpy().tolist()},separators=(',',':')))
np.savez(ROOT/'cnn-completions.npz',input=pen_partial[:20].numpy(),output=reconstruction[:20].numpy(),labels=pen_y[:20].numpy())
