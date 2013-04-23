/* Nebulan.js */
(function($) {
    KWNebulan = {
        // Key frame parameters
        keyFrameAmount: 3,
        keyFrameInterval: 2000,
        // Canvas
        canvas: {},
        // Animation variables
        animateFrameCounter: 0,
        animateQueue: [],
        renderInterval: 120,
        renderLength: this.keyFrameInterval/this.renderInterval,
        renderCounter: 0,
        renderLoop: {},
        diffFrame: {},
        diffFrameCache: {},
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
        generateDiffFrameCache: function () {
            var self = this;
            for (var i = self.animateQueue.length - 1; i >= 0; i--) {
                
                var i_start = i;
                var i_end = (i_start + 1) % self.animateQueue.length;

                var startFrame = self.animateQueue[i_start];
                var endFrame = self.animateQueue[i_end];
                var diffFrame = new KWNebulanLibrary.Frame($V([startFrame.width, startFrame.height]));
                diffFrame.add(endFrame);
                diffFrame.subtract(startFrame);
                diffFrame.multiplyByScalar(self.renderInterval/self.keyFrameInterval);
                self.diffFrameCache[[i_start, i_end]] = diffFrame;
            };
        },
        transitFrame: function (startFrame, endFrame) {
            var self = KWNebulan;
            var i_start = self.animateFrameCounter;
            var i_end = (i_start + 1) % self.animateQueue.length;
            self.renderLoop = setInterval(function () {
                var self = KWNebulan;
                if (self.renderCounter == self.renderLength)
                    clearInterval(self.renderLoop);
                self.currentFrame.add(self.diffFrameCache[[i_start, i_end]]);
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
            self.generateDiffFrameCache();
            setInterval(self.doAnimateQueue, self.keyFrameInterval);
        },
        setup: function () {
            var self = KWNebulan;
          
            // Set up canvas size from DOM
            self.canvas = document.getElementById("canvas");
            var canvas_size = $V([canvas.width, canvas.height]);
          
            // Import Frame from KWNebulanLibrary
            var Frame = KWNebulanLibrary.Frame;
          
            // Generate key frames of fractional brownian motion noise
            var output_frames = [];
            for (var i = self.keyFrameAmount; i >= 0; i--) {
                var fbm_frame = new Frame(canvas_size);
                fbm_frame.generateFractionalBrownianMotion();
                output_frames.push(fbm_frame);
            }
            
            // Start animating frames
            self.pushAnimateFrame(output_frames);
            self.startAnimate();
        }
    };
    $(KWNebulan.setup);
})(jQuery);