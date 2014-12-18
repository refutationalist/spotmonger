#!/bin/sh


rm -Rf work/*

mkdir -p work/mk/usr/share/icons/hicolor/128x128/apps/
inkscape -z -e work/mk/usr/share/icons/hicolor/128x128/apps/spotmonger.png -w 128 -h 128 icons/spotmonger.svg


mkdir -p work/mk/usr/share/icons/hicolor/16x16/apps/
inkscape -z -e work/mk/usr/share/icons/hicolor/16x16/apps/spotmonger.png -w 16 -h 16 icons/spotmonger.svg



mkdir -p work/mk/usr/share/icons/hicolor/256x256/apps/
inkscape -z -e work/mk/usr/share/icons/hicolor/256x256/apps/spotmonger.png -w 256 -h 256 icons/spotmonger.svg



mkdir -p work/mk/usr/share/icons/hicolor/32x32/apps/
inkscape -z -e work/mk/usr/share/icons/hicolor/32x32/apps/spotmonger.png -w 32 -h 32 icons/spotmonger.svg



mkdir -p work/mk/usr/share/icons/hicolor/48x48/apps/
inkscape -z -e work/mk/usr/share/icons/hicolor/48x48/apps/spotmonger.png -w 48 -h 48 icons/spotmonger.svg



mkdir -p work/mk/usr/share/icons/hicolor/512x512/apps/
inkscape -z -e work/mk/usr/share/icons/hicolor/512x512/apps/spotmonger.png -w 512 -h 512 icons/spotmonger.svg


mkdir -p work/mk/usr/share/spotmonger

cp work/mk/usr/share/icons/hicolor/256x256/apps/spotmonger.png app/icon.png

cd app

zip -r ../work/mk/usr/share/spotmonger/spotmonger.nw *

cd ..


mkdir -p work/mk/usr/bin/
mkdir -p work/mk/usr/share/applications
cp package/spotmonger.exec work/mk/usr/bin/spotmonger
cp package/PKGBUILD work
cp package/spotmonger.install work
cp package/spotmonger.desktop work/mk/usr/share/applications

cd work/
tar zcvf spotmonger.tgz mk
makepkg -g >> PKGBUILD
makepkg
mv *pkg.tar.xz ..
cd ..

