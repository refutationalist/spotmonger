#!/bin/sh


rm -Rf work/*

mkdir -p work/mk/usr/share/icons/hicolor/128x128/apps/
inkscape -z -e work/mk/usr/share/icons/hicolor/128x128/apps/cartamoc.png -w 128 -h 128 icons/cartamoc.svg


mkdir -p work/mk/usr/share/icons/hicolor/16x16/apps/
inkscape -z -e work/mk/usr/share/icons/hicolor/16x16/apps/cartamoc.png -w 16 -h 16 icons/cartamoc.svg



mkdir -p work/mk/usr/share/icons/hicolor/256x256/apps/
inkscape -z -e work/mk/usr/share/icons/hicolor/256x256/apps/cartamoc.png -w 256 -h 256 icons/cartamoc.svg



mkdir -p work/mk/usr/share/icons/hicolor/32x32/apps/
inkscape -z -e work/mk/usr/share/icons/hicolor/32x32/apps/cartamoc.png -w 32 -h 32 icons/cartamoc.svg



mkdir -p work/mk/usr/share/icons/hicolor/48x48/apps/
inkscape -z -e work/mk/usr/share/icons/hicolor/48x48/apps/cartamoc.png -w 48 -h 48 icons/cartamoc.svg



mkdir -p work/mk/usr/share/icons/hicolor/512x512/apps/
inkscape -z -e work/mk/usr/share/icons/hicolor/512x512/apps/cartamoc.png -w 512 -h 512 icons/cartamoc.svg


mkdir -p work/mk/usr/share/cartamoc

cp work/mk/usr/share/icons/hicolor/256x256/apps/cartamoc.png app/icon.png

cd app

zip -r ../work/mk/usr/share/cartamoc/cartamoc.nw *

cd ..


mkdir -p work/mk/usr/bin/
mkdir -p work/mk/usr/share/applications
cp package/cartamoc.exec work/mk/usr/bin/cartamoc
cp package/PKGBUILD work
cp package/cartamoc.install work
cp package/cartamoc.desktop work/mk/usr/share/applications

cd work/
tar zcvf cartamoc.tgz mk
makepkg -g >> PKGBUILD
makepkg
mv *pkg.tar.xz ..
cd ..

