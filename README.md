SpotMonger
==========

![SpotMonger as of May 2016](https://raw.githubusercontent.com/refutationalist/spotmonger/master/example.png)

**Note:** Master branch doesn't work as of 2017-3-29.  Use tag v1.1 for something known to work.

SpotMonger is a basic "cart player," a broadcast studio tool for playing pre-recorded audio segments, jingles, leads, and other incidental audio.  SpotMonger extends that by allowing timed cueing, useful for scheduling commercial breaks.   It is optimized for touchscreens.

It is written in [nw.js](http://nwjs.io) and thus is written like something between a web page and a node app.  It calls tar, ffprobe (part of ffmpeg), and most importantly mplayer, which is used as the actual audio player.  SpotMonger *requires* JACK.

If you're into Arch Linux and weirdness, you're pretty much in good shape to get this running.   Otherwise, it make take some work.  

The (eventual) end users would be podcast producers who prefer live production, and community radio broadcasters.

I'll call this all GPLv3 for now unless a better idea comes along.  Includes jQuery, [Font Awesome](https://fortawesome.github.io/Font-Awesome/) and some fonts from the Google Web Fonts kit.   As I didn't originally plan on releasing this, I may need to change some of that around as time goes on.
