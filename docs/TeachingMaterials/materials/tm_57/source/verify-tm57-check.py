from math import *
d=radians
c=[
 (225*pi/180, 5*pi/4),(7*pi/6*180/pi,210),(sin(5*pi/6),.5),(cos(4*pi/3),-.5),
 (sin(d(15)),(sqrt(6)-sqrt(2))/4),(cos(d(105)),(sqrt(2)-sqrt(6))/4),(tan(d(15)),2-sqrt(3)),
 (sin(atan(.5)+atan(1/3)) , sin(pi/4)),
 (sin(asin(.6)+acos(5/13)),63/65),(cos(asin(.6)-acos(5/13)),56/65),
 (sin(2*asin(.8)),24/25),(cos(2*asin(.8)),-7/25),(tan(2*atan(3)),-.75),
 (sin(pi/8),sqrt(2-sqrt(2))/2),(cos(acos(1/9)/2),sqrt(5)/3),
 (tan((2*pi-acos(-7/25))/2),-4/3),
 (min(cos(2*x/1000)+2*cos(x/1000) for x in range(6284)),-1.5),
 (sin(d(75))*cos(d(15)),(2+sqrt(3))/4),
 (min(sin(x/1000)+cos(x/1000) for x in range(3142)),-1),
 (min(sin(x/1000)+sqrt(3)*cos(x/1000) for x in range(1571)), 2*sin(5*pi/6)),
 (max(5*sin(x/1000)-12*cos(x/1000) for x in range(6284)),13),
]
for i,(a,b) in enumerate(c): print(i, 'OK' if abs(a-b)<2e-3 else 'BAD', a, b)
# solutions count
import numpy as np
xs=np.linspace(-10,10,2000001); f=np.sin(xs)-xs/4; print('roots sinx=x/4', ((f[:-1]*f[1:])<0).sum()+ (f==0).sum())
xs=np.linspace(0,2*pi,2000001)[:-1]; f=np.cos(2*xs)-np.sin(xs); s=np.sign(f); print('cos2x=sinx sign changes', (s[:-1]*s[1:]<0).sum())
print('2sin(t-pi/2)->T at 12', 5*sin(pi*12/12-pi/2)+20)
print('tan angle 3,-2', abs((3+2)/(1-6)))
