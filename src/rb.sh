#!/bin/bash
# usage: rb.sh i0 i1 ...  chunk indices (797 frames each, 16 chunks)
cd /workspace/work/mv2
N=12743; S=797
for i in "$@"; do f0=$((i*S)); f1=$(( (i+1)*S )); [ $f1 -gt $N ] && f1=$N
  [ -s out/ch_$i.mp4 ] || PRESET=medium CRF=17 node render.js video $f0 $f1 out/ch_$i.mp4 2>out/log_$i.txt &
done; wait
