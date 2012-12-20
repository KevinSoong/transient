/* Nebulan.js */
(function($) {
    KWNebulan = {
        canvas: {},
        renderFrame: function (aFrame) {
            var self = KWNebulan;
            var ctx = self.canvas.getContext("2d");
            for (var x = self.canvas.width - 1; x >= 0 ; x--)
                for (var y = self.canvas.height - 1; y >= 0 ; y--)
                {
                    ctx.fillStyle = "rgb("+aFrame.frame[x][y].elements[0]+","
                                          +aFrame.frame[x][y].elements[0]+","
                                          +aFrame.frame[x][y].elements[0]+")";
                    ctx.fillRect(x,y,1,1);
                }
        },
        setup: function () {
            var self = KWNebulan;
            self.canvas = document.getElementById("canvas");
            var canvas_size = $V([canvas.width, canvas.height]);

            var Frame = KWNebulanLibrary.Frame;
            // var noise_frame = new Frame(canvas_size);
            // noise_frame.generateNoise();

            var fbm_frame = new Frame(canvas_size);
            fbm_frame.generateFractionalBrownianMotion();

            var output = fbm_frame;
            self.renderFrame(output);
        }
    };
    $(KWNebulan.setup);
})(jQuery);