import numpy as np, os, sys
from PIL import Image
SRC='/workspace/work/mv/gen'; DST='/workspace/work/mv2/art'
inks=np.array([[245,233,214],[185,163,218],[51,34,58]],float)
for f in sorted(os.listdir(SRC)):
  if not f.endswith('.png') or f.startswith('_'): continue
  n=f[:-4]; im=np.array(Image.open(os.path.join(SRC,f)).convert('RGBA')).astype(float)
  a=im[...,3]
  if n=='eye': a[:]=255
  ys,xs=np.where(a>20); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
  im=im[y0:y1,x0:x1]; a=im[...,3]
  rgb=im[...,:3]; d=((rgb[:,:,None,:]-inks[None,None])**2).sum(-1); k=d.argmin(-1)
  out=[]
  for i in range(3):
    m=np.where(k==i,a,0).astype(np.uint8)
    L=np.zeros(m.shape+(4,),np.uint8); L[...,:3]=255; L[...,3]=m
    img=Image.fromarray(L)
    s=min(1.0,1500/max(img.size)); 
    if s<1: img=img.resize((int(img.width*s),int(img.height*s)),Image.LANCZOS)
    img.save(f'{DST}/{n}_L{i}.png')
  q=np.zeros(im.shape,np.uint8); q[...,:3]=inks[k].astype(np.uint8); q[...,3]=a.astype(np.uint8)
  img=Image.fromarray(q); s=min(1.0,1500/max(img.size))
  if s<1: img=img.resize((int(img.width*s),int(img.height*s)),Image.LANCZOS)
  img.save(f'{DST}/{n}.png'); print(n,img.size)
