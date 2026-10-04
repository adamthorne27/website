from pathlib import Path
import base64,json,sys,time
import numpy as np
from PIL import Image,ImageDraw
import torch
from torch import nn
from torch.nn import functional as F
r=Path(sys.argv[1]) if len(sys.argv)>1 else Path('/private/tmp/adam-portfolio-mnist');s=Path(__file__).with_name('train-cnn.py').read_text()
# Reuse the exact preparation and architecture without running optimization again.
exec(s[:s.index('# Validation writers')]);exec(s[s.index('class Sketch'):s.index('model=Sketch();opt')])
base=Sketch();base.load_state_dict(torch.load(r/'cnn-best.pt',weights_only=True));base.eval()
for p in base.parameters():p.requires_grad_(False)
start=time.time();pen=strokes('tra');train_pen=[p for p in pen if p[1]<=25];val_pen=[p for p in pen if p[1]>25]
mx,my=mnist('train');obs=[mx[:55000]];target=[mx[:55000]];labels=[my[:55000]]
for repeat in range(6):
    xx=[];yy=[];zz=[]
    for d,w,p in train_pen:
        width=int(rng.integers(3,8));fraction=1 if repeat<2 else float(rng.uniform(.35,.95))
        xx.append(raster(p,fraction,width));yy.append(raster(p,1,width));zz.append(d)
    obs.append(np.stack(xx));target.append(np.stack(yy));labels.append(np.array(zz))
x=torch.from_numpy(np.concatenate(obs)).float()[:,None]/255
full=torch.from_numpy(np.concatenate(target)).float().flatten(1)/255;y=torch.from_numpy(np.concatenate(labels)).long()
with torch.no_grad():
    result=[base(b) for b in x.split(512)];state=torch.cat([v[0] for v in result]);logits=torch.cat([v[1] for v in result])
# Use validation writers and partial stroke observations to calibrate the score display.
vx=[mx[55000:]];vy=[my[55000:]]
for fraction in [1,.5,.65,.8]:
    vx.append(np.stack([raster(p,fraction) for d,w,p in val_pen]));vy.append(np.array([d for d,w,p in val_pen]))
vx=torch.from_numpy(np.concatenate(vx)).float()[:,None]/255;vy=torch.from_numpy(np.concatenate(vy)).long()
with torch.no_grad():vl=torch.cat([base(b)[1] for b in vx.split(512)])
temperature=float(min(torch.linspace(.8,2.5,35),key=lambda t:F.cross_entropy(vl/t,vy).item()))
features=torch.cat([state,(logits/temperature).softmax(1)],1)
correct=logits.argmax(1)==y;features=features[correct];full=full[correct];y=y[correct]
decoder=nn.Sequential(nn.Linear(42,256),nn.ReLU(),nn.Linear(256,784))
with torch.no_grad():
    decoder[0].weight[:,:32]=base.decoder[0].weight;decoder[0].bias.copy_(base.decoder[0].bias);decoder[2].load_state_dict(base.decoder[2].state_dict())
opt=torch.optim.Adam(decoder.parameters(),lr=.0005)
for epoch in range(8):
    for ids in torch.randperm(len(features)).split(256):
        out=decoder(features[ids]);decoded=out.sigmoid()
        # The frozen input reader keeps the forecast recognizable.
        semantic=base(decoded.reshape(-1,1,28,28))[1]
        loss=F.binary_cross_entropy_with_logits(out,full[ids])+.22*F.cross_entropy(semantic,y[ids])
        opt.zero_grad();loss.backward();opt.step()
    print('decoder epoch',epoch+1,'seconds',round(time.time()-start,1),flush=True)
base.decoder=decoder;decoder.eval()

def infer(x):
    state=base.encoder(base.conv(x));logits=base.classifier(state);probs=(logits/temperature).softmax(1)
    output=decoder(torch.cat([state,probs],1)).sigmoid();return state,probs,output

def completion_recognition(inp,truth):
    with torch.no_grad():
        out=torch.cat([infer(b)[2] for b in inp.split(512)])
        pred=torch.cat([base.classifier(base.encoder(base.conv(b.reshape(-1,1,28,28)))) for b in out.split(512)]).argmax(1)
    return float((pred==truth).float().mean()),out
pt=strokes('tes');py=torch.tensor([d for d,w,p in pt]);px=torch.from_numpy(np.stack([raster(p,.65) for d,w,p in pt])).float()[:,None]/255
completion_accuracy,out=completion_recognition(px,py)
reg=np.load(r/'drawn-regression.npz');rx=torch.from_numpy(reg['input']).float()[:,None]/255
reg_completion_accuracy,reg_output=completion_recognition(rx,torch.from_numpy(reg['labels']))
asset=json.loads((r/'cnn-model.js').read_text().split('window.digitModel = ')[1].rstrip(';\n'))
weights=np.concatenate([p.detach().numpy().reshape(-1) for p in base.parameters()]).astype('<f4');asset['weights']=base64.b64encode(weights.tobytes()).decode();asset['decoder']=[42,256,784];asset['temperature']=temperature
(r/'cnn-model.js').write_text('/* Shared convolutional encoder trained on MNIST and UCI pen trajectories. Local inference. */\nwindow.digitModel = '+json.dumps(asset,separators=(',',':'))+';\n')
report=json.loads((r/'cnn-report.json').read_text());report.update({'parameters':len(weights),'temperature':temperature,'decoder_fine_tune_epochs':8,'decoder_training_pairs':len(features),'decoder_training_seconds':round(time.time()-start,2),'65_percent_completion_recognition':completion_accuracy,'drawn_regression_completion_recognition':reg_completion_accuracy,'completion_metric_note':'Recognition by the frozen input classifier is a consistency diagnostic, not independent perceptual quality.'})
(r/'cnn-report.json').write_text(json.dumps(report,indent=2));print(report,flush=True)
# Export representative full/partial and regression tensors for browser-math parity.
mt,myt=mnist('t10k');ix=np.concatenate([np.flatnonzero(myt==d)[:2] for d in range(10)])
pen_indices=np.array([next(i for i,p in enumerate(pt) if p[0]==d) for d in range(10)])
parity=torch.cat([torch.from_numpy(mt[ix]).float()[:,None]/255,px[pen_indices],rx])
with torch.no_grad():state,probs,out=infer(parity)
(r/'cnn-parity.json').write_text(json.dumps({'images':parity.flatten(1).numpy().tolist(),'state':state.numpy().tolist(),'probabilities':probs.numpy().tolist(),'completion':out.numpy().tolist()},separators=(',',':')))
# Visual check: one held-out partial stroke and a regression drawing for each digit.
with torch.no_grad():_,_,forecast=infer(px[pen_indices])
canvas=Image.new('RGB',(10*130,4*130),(244,240,230));draw=ImageDraw.Draw(canvas)
for i in range(10):
    draw.text((i*130+10,4),str(i),fill=(35,63,50))
    for row,data in [(0,px[pen_indices[i],0].numpy()),(1,forecast[i].reshape(28,28).numpy()),(2,rx[i*5,0].numpy()),(3,reg_output[i*5].reshape(28,28).numpy())]:
        a=(np.clip(data,0,1)*255).astype(np.uint8);img=Image.fromarray(a).resize((100,100),Image.Resampling.NEAREST).convert('RGB');canvas.paste(img,(i*130+15,row*130+25))
canvas.save(r/'completion-quality.png')
