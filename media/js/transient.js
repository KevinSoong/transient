/* transient.js */
(function($) {
    KWTransient = {
        /* Parameters */
        keyFrameAmount: 3,
        keyFrameInterval: 2000,

        /* Internal variables */
        // Canvas
        canvas: {},
        // Animation variables
        animationFrameCounter: 0,
        animationQueue: [],
        renderingInterval: 120,
        renderingLength: this.keyFrameInterval/this.renderingInterval,
        renderingCounter: 0,
        renderCrossfade: {},
        diffFrame: {},
        diffFrameCache: {},
        currentFrame: {},
        currentNomalizedFrame: {},
        // Animation methods
        renderFrame: function (aFrame) {
            var self = KWTransient;
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
            for (var i = self.animationQueue.length - 1; i >= 0; i--) {
                
                var i_start = i;
                var i_end = (i_start + 1) % self.animationQueue.length;

                var startFrame = self.animationQueue[i_start];
                var endFrame = self.animationQueue[i_end];
                var diffFrame = new KWNebulanLibrary.Frame($V([startFrame.width, startFrame.height]));
                diffFrame.add(endFrame);
                diffFrame.subtract(startFrame);
                diffFrame.multiplyByScalar(self.renderingInterval/self.keyFrameInterval);
                self.diffFrameCache[[i_start, i_end]] = diffFrame;
            };
        },
        crossfadeFrame: function (startFrame, endFrame) {
            var self = KWTransient;
            var i_start = self.animationFrameCounter;
            var i_end = (i_start + 1) % self.animationQueue.length;
            self.renderCrossfade = setInterval(function () {
                var self = KWTransient;
                if (self.renderingCounter == self.renderingLength)
                    clearInterval(self.renderCrossfade);
                self.currentFrame.add(self.diffFrameCache[[i_start, i_end]]);
                self.renderFrame(self.currentFrame);
                self.renderingCounter++;
            }, self.renderingInterval);
        },
        pushAnimationFrame: function (frameArray) {
            var self = KWTransient;
            for (var i = 0; i < frameArray.length; i++) {
                self.animationQueue.push(frameArray[i]);
            };
        },
        animateQueue: function () {
            var self = KWTransient;
            if (self.renderCrossfade)
                clearInterval(self.renderCrossfade);
            var referenceFrame = self.animationQueue[self.animationFrameCounter];
            self.currentFrame = new KWNebulanLibrary.Frame($V([referenceFrame.width, referenceFrame.height]));
            self.currentFrame.add(referenceFrame);
            self.crossfadeFrame(self.animationQueue[self.animationFrameCounter], self.animationQueue[(self.animationFrameCounter + 1) % self.animationQueue.length]);
            self.animationFrameCounter = (++self.animationFrameCounter) % self.animationQueue.length;
        },
        startAnimate: function () {
            var self = KWTransient;
            self.generateDiffFrameCache();
            setInterval(self.animateQueue, self.keyFrameInterval);
        },
        // Page initialization
        setup: function () {
            var self = KWTransient;
          
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
            self.pushAnimationFrame(output_frames);
            self.startAnimate();
        }
    };
    $(KWTransient.setup);
})(jQuery);