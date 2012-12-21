/* Nebulan.js */
(function($) {
    KWNebulan = {
        canvas: {},
        animateFrameCounter: 0,
        animateQueue: [],
        keyFrameInterval: 4000,
        renderInterval: 120,
        renderLength: this.keyFrameInterval/this.renderInterval,
        renderCounter: 0,
        renderLoop: {},
        diffFrame: {},
        currentFrame: {},
        currentNomalizedFrame: {},
        renderFrame: function (aFrame) {
            var self = KWNebulan;
            var ctx = self.canvas.getContext("2d");
            for (var x = self.canvas.width - 1; x >= 0 ; x--)
                for (var y = self.canvas.height - 1; y >= 0 ; y--)
                {
                    var value = Math.ceil(aFrame.frame[x][y].elements[0]);
                    ctx.fillStyle = "rgb("+value+","
                                          +value+","
                                          +value+")";
                    ctx.fillRect(x, y, 1, 1);
                }
        },
        transitFrame: function (startFrame, endFrame) {
            var self = KWNebulan;
            var diffFrame = new KWNebulanLibrary.Frame($V([startFrame.width, startFrame.height]));
            diffFrame.add(endFrame);
            diffFrame.subtract(startFrame);
            diffFrame.multiplyByScalar(self.renderInterval/self.keyFrameInterval);
            self.diffFrame = diffFrame;
            self.renderLoop = setInterval(function () {
                var self = KWNebulan;
                if (self.renderCounter == self.renderLength)
                    clearInterval(self.renderLoop);
                self.currentFrame.add(self.diffFrame);
                self.renderFrame(self.currentFrame);
                self.renderCounter++;
            }, self.renderInterval);
        },
        pushAnimateFrame: function (frameArray) {
            var self = KWNebulan;
            for (var i = 0; i < frameArray.length; i++) {
                self.animateQueue.push(frameArray[i]);
            };
        },
        doAnimateQueue: function () {
            var self = KWNebulan;
            if (self.renderLoop)
                clearInterval(self.renderLoop);
            var referenceFrame = self.animateQueue[self.animateFrameCounter];
            self.currentFrame = new KWNebulanLibrary.Frame($V([referenceFrame.width, referenceFrame.height]));
            self.currentFrame.add(referenceFrame);
            self.transitFrame(self.animateQueue[self.animateFrameCounter], self.animateQueue[(self.animateFrameCounter + 1) % self.animateQueue.length]);
            self.animateFrameCounter = (++self.animateFrameCounter) % self.animateQueue.length;
        },
        startAnimate: function () {
            var self = KWNebulan;
            setInterval(self.doAnimateQueue, self.keyFrameInterval);
            console.log(self.animateQueue.length);
        },
        setup: function () {
            var self = KWNebulan;
            self.canvas = document.getElementById("canvas");
            var canvas_size = $V([canvas.width, canvas.height]);

            var Frame = KWNebulanLibrary.Frame;
            // var noise_frame = new Frame(canvas_size);
            // noise_frame.generateNoise();
            var output_frames = [];
            for (var i = 3; i >= 0; i--) {
                var fbm_frame = new Frame(canvas_size);
                fbm_frame.generateFractionalBrownianMotion();
                output_frames.push(fbm_frame);
            }
            self.pushAnimateFrame(output_frames);
            self.startAnimate();
            //var output = output_frames[0];
            //self.renderFrame(output);
        }
    };
    $(KWNebulan.setup);
})(jQuery);