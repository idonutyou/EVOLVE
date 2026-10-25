#!/usr/bin/env python3
"""Bind the approved photograph to a four-leg rig without changing its RGB bytes."""
import argparse, hashlib, json, shutil
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]

def main():
    p=argparse.ArgumentParser();p.add_argument('source',type=Path);a=p.parse_args()
    raw=a.source.read_bytes();sha=hashlib.sha256(raw).hexdigest()
    image=Image.open(a.source).convert('RGB');pixels=np.asarray(image);h,w=pixels.shape[:2]
    assert (w,h)==(1254,1254), (w,h)
    def polygon(points):
        im=Image.new('1',(w,h));ImageDraw.Draw(im).polygon(points,fill=1);return np.asarray(im,dtype=bool)
    # Authored outlines only select original pixels. The original PNG is copied unchanged.
    torso=[(326,363),(375,325),(430,302),(500,274),(556,254),(585,249),(620,261),(652,275),(693,292),(735,322),(775,348),(807,378),(829,404),(861,429),(892,452),(931,475),(967,491),(995,520),(1026,552),(1062,590),(1090,625),(1110,660),(1116,692),(1106,723),(1091,745),(1075,766),(1053,753),(1030,735),(1005,720),(975,703),(945,692),(912,678),(876,653),(845,632),(809,612),(774,594),(737,576),(705,557),(671,546),(641,538),(611,542),(577,547),(540,547),(509,539),(476,541),(441,554),(412,553),(385,538),(360,517),(340,492),(337,458),(319,430),(316,400)]
    near_arm=[(795,601),(778,578),(769,548),(766,513),(770,478),(785,448),(810,429),(836,416),(852,397),(859,377),(878,367),(910,379),(943,401),(968,421),(988,450),(1004,477),(1024,495),(1038,523),(1034,553),(1010,581),(993,598),(985,586),(994,561),(1002,540),(982,518),(958,500),(935,478),(916,461),(892,446),(866,441),(840,453),(824,470),(825,495),(845,526),(858,555),(857,582),(837,605),(812,608)]
    far_arm=[(955,475),(976,446),(998,419),(1037,389),(1068,369),(1088,351),(1110,351),(1139,371),(1166,394),(1182,421),(1202,445),(1211,477),(1207,515),(1191,550),(1173,575),(1165,575),(1177,539),(1187,505),(1178,482),(1165,469),(1144,463),(1118,443),(1096,426),(1079,414),(1055,422),(1021,448),(997,470),(972,489)]
    tail=[(371,364),(335,362),(300,351),(260,342),(230,324),(205,296),(197,270),(214,241),(241,216),(270,197),(297,180),(270,183),(238,193),(209,208),(183,224),(169,246),(152,269),(138,293),(126,324),(138,355),(160,382),(194,403),(229,418),(270,425),(307,422),(344,409),(371,397)]
    legs=[
      dict(name='rear_far',far=True,hind=True,phase=.5,lead=35,hip=[455,480],knee=[492,635],ankle=[550,696],toe=[565,718],poly=[(483,568),(507,584),(509,613),(529,637),(545,656),(566,665),(585,679),(600,697),(601,716),(585,723),(568,712),(552,729),(537,726),(523,713),(509,722),(495,710),(486,691),(480,670),(464,648),(461,617),(468,590)]),
      dict(name='front_far',far=True,hind=False,phase=0,lead=-25,hip=[908,592],knee=[969,727],ankle=[1020,801],toe=[1030,835],poly=[(902,623),(943,619),(964,656),(991,691),(1012,738),(1044,759),(1079,787),(1097,816),(1095,841),(1079,848),(1058,835),(1048,851),(1033,865),(1016,861),(1008,841),(993,852),(976,845),(968,828),(951,817),(946,792),(932,771),(924,744),(906,716),(888,681),(892,646)]),
      dict(name='rear_near',far=False,hind=True,phase=0,lead=225,hip=[342,550],knee=[205,591],ankle=[119,724],toe=[132,776],poly=[(366,508),(334,507),(301,515),(273,515),(249,506),(220,508),(199,521),(174,531),(154,557),(145,580),(126,612),(105,645),(84,666),(72,692),(61,711),(46,737),(45,754),(55,763),(71,758),(85,749),(96,771),(111,790),(126,798),(135,789),(141,769),(157,780),(177,784),(185,776),(205,784),(216,773),(211,751),(190,724),(192,706),(202,679),(218,651),(242,626),(271,618),(294,610),(319,602),(342,585),(358,562),(369,541)]),
      dict(name='front_near',far=False,hind=False,phase=.5,lead=-25,hip=[704,572],knee=[779,792],ankle=[891,967],toe=[911,1015],poly=[(660,532),(700,515),(740,530),(771,554),(791,602),(796,645),(790,688),(785,722),(808,758),(829,795),(849,833),(870,869),(893,909),(916,935),(943,955),(972,976),(985,1000),(978,1024),(960,1030),(943,1015),(930,1042),(913,1050),(899,1029),(885,1011),(869,1017),(847,1008),(824,1010),(804,1005),(804,985),(817,964),(830,951),(823,930),(812,905),(793,873),(772,838),(751,801),(731,767),(710,738),(697,701),(681,673),(662,648),(646,610),(644,571)])
    ]
    rgb=pixels.astype(np.int16)
    chroma=(rgb[:,:,0]-rgb[:,:,1]>4)|((rgb[:,:,1]-rgb[:,:,0]>8)&(rgb[:,:,2]-rgb[:,:,0]>10))|(rgb.max(2)>95)
    def select(poly):
        bounds=polygon(poly)
        m=ndimage.binary_closing(chroma&bounds,iterations=2)&bounds
        return ndimage.binary_fill_holes(m)&bounds
    # The photograph's torso extends behind the visible hips. Use the outlines
    # only as a loose foreground envelope, not as hard cuts through the belly.
    bounds=polygon(torso)|polygon(near_arm)|polygon(far_arm)|polygon(tail)
    for leg in legs:bounds|=polygon(leg['poly'])
    bounds=ndimage.binary_dilation(bounds,iterations=36)
    foreground=ndimage.binary_closing(chroma&bounds,iterations=2)
    labels,count=ndimage.label(foreground);sizes=np.bincount(labels.ravel());sizes[0]=0
    foreground=np.isin(labels,np.flatnonzero(sizes>55))
    full=ndimage.binary_fill_holes(foreground)
    full=ndimage.binary_dilation(full,iterations=1)&bounds
    # The broad envelope above joins dark tissue, but must not retain studio
    # floor reflections below the claws. Keep the authored anatomy envelope at
    # the exterior; RGB texture samples remain the unmodified source pixels.
    yy,xx=np.mgrid[:h,:w]
    for leg in legs:
        poly=np.array(leg['poly']);outline=ndimage.binary_dilation(polygon(leg['poly']),iterations=4)
        foot_zone=(yy>leg['ankle'][1]-10)&(yy<poly[:,1].max()+40)&(xx>=poly[:,0].min()-36)&(xx<=poly[:,0].max()+36)
        full &= ~(foot_zone&~outline)
    tail_mask=full&ndimage.binary_dilation(polygon(tail),iterations=18)
    # Include the complete shin/claw silhouette. A narrow polygon left strips
    # of the original leg in the static torso while the rig moved its main part.
    leg_masks=[full&ndimage.binary_dilation(polygon(l['poly']),iterations=36) for l in legs]
    body=full&~(tail_mask&~polygon(torso))
    yy,xx=np.mgrid[:h,:w]
    for leg,mask in zip(legs,leg_masks):
        x,y=leg['hip'];cap=(xx-x)**2+(yy-y)**2<24**2
        body &= ~(mask&~cap&~polygon(torso))
    # Detached source pixels are discarded from the static torso, rather than
    # floating in their old positions when a leg or tail moves away.
    body_labels,_=ndimage.label(body);body_sizes=np.bincount(body_labels.ravel());body_sizes[0]=0
    body=body_labels==int(body_sizes.argmax())
    def part(mask):
        ys,xs=np.nonzero(mask)
        assert len(xs)>20
        x0,x1=int(xs.min()),int(xs.max())+1;y0,y1=int(ys.min()),int(ys.max())+1
        runs=[]
        for y in range(y0,y1):
            edges=np.diff(np.r_[False,mask[y,x0:x1],False].astype(np.int8))
            for x,end in zip(np.flatnonzero(edges==1),np.flatnonzero(edges==-1)):
                runs.append([y-y0,int(x),int(end-x)])
        return dict(rect=[x0,y0,x1-x0,y1-y0],runs=runs,pixels=int(mask.sum()))
    for leg,mask in zip(legs,leg_masks):
        ys,xs=np.nonzero(mask);coords=np.c_[xs,ys];bones=[leg['hip'],leg['knee'],leg['ankle'],leg['toe']]
        distances=[]
        for a0,b0 in zip(bones,bones[1:]):
            a0=np.array(a0);v=np.array(b0)-a0;t=np.clip(((coords-a0)*v).sum(1)/(v@v),0,1)
            distances.append(np.linalg.norm(coords-(a0+t[:,None]*v),axis=1))
        ds=np.stack(distances,axis=1);best=ds.min(1)
        foot_dir=np.array(leg['toe'])-leg['ankle'];foot_dir=foot_dir/np.linalg.norm(foot_dir)
        foot_side=((coords-leg['ankle'])*foot_dir).sum(1)>-23
        leg['segments']=[]
        for i in range(3):
            selected=(ds[:,i]<best+8)
            if i==2:selected |= foot_side
            elif i==0:selected &= ~foot_side
            else:selected &= (((coords-leg['ankle'])*foot_dir).sum(1)<12)
            m=np.zeros((h,w),bool);m[ys[selected],xs[selected]]=True
            leg['segments'].append(part(m)|dict(a=bones[i],b=bones[i+1]))
        leg.pop('poly')
    # Slice original tail pixels into reusable, overlapping armor sections.
    spine=np.array([[363,390],[309,394],[255,382],[204,361],[166,326],[156,288],[178,252],[214,222],[264,195]],float)
    ys,xs=np.nonzero(tail_mask);q=np.c_[xs,ys];ds=[]
    for a0,b0 in zip(spine,spine[1:]):
        v=b0-a0;t=np.clip(((q-a0)*v).sum(1)/(v@v),0,1);ds.append(np.linalg.norm(q-(a0+t[:,None]*v),axis=1))
    ds=np.stack(ds,axis=1);best=ds.min(1);tail_parts=[]
    for i,(a0,b0) in enumerate(zip(spine,spine[1:])):
        keep=ds[:,i]<best+6;m=np.zeros((h,w),bool);m[ys[keep],xs[keep]]=True
        tail_parts.append(part(m)|dict(a=a0.tolist(),b=b0.tolist()))
    scale=.238;anchor=[650,500]
    art=dict(version=599,path='assets/'+sha+'.png',sha256=sha,bytes=len(raw),width=w,height=h,anchor=anchor,
             displaySize=84,surface=384,sourceScale=scale,nativeFacing=.36,previewSurface=1536,
             full=part(full),body=part(body),tail=part(tail_mask),legs=legs,tailParts=tail_parts,
             tailRoot=[363,390],mouth=[1090,700],shell=[655,351],wrists=[[973,477],[1160,440]],
             original_source_bytes_unchanged=True,generated_redraw=False)
    (ROOT/'dist/assets').mkdir(exist_ok=True,parents=True)
    target=ROOT/'dist'/art['path']
    if a.source.resolve()!=target.resolve():shutil.copyfile(a.source,target)
    (ROOT/'web/player-mutant-art-v599.json').write_text(json.dumps(art,separators=(',',':'))+'\n')
    debug=ROOT/'test-results';debug.mkdir(exist_ok=True)
    proof=np.empty_like(pixels);proof[:]=[23,73,81];proof[full]=pixels[full]
    Image.fromarray(proof).save(debug/'player-mutant-mask-proof.jpg',quality=95)
    print(json.dumps(dict(source=art['path'],bytes=len(raw),foreground=int(full.sum()),maskRuns=len(art['full']['runs']),legParts=sum(len(l['segments']) for l in legs),tailParts=len(tail_parts))))

if __name__=='__main__':main()
